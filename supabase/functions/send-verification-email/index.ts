// Sends a review email to CuraLink staff the moment a professional submits
// their onboarding application (docs + bank details). Called automatically
// by the notify_verification_submitted trigger (see the
// email_verification_review migration) via net.http_post, the same way
// trigger_push_notification drives send-push-notification.
//
// Deployed with --no-verify-jwt: the caller is Postgres via pg_net, not an
// end user -- the x-internal-secret header (shared with
// trigger_push_notification) is what's actually checked.
//
// Required Edge Function secrets:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -- present by default.
//   INTERNAL_TRIGGER_SECRET -- same shared secret trigger_push_notification uses.
//   RESEND_API_KEY -- Edge Function secrets are a separate store from the
//     Auth SMTP config, which already uses Resend on the verified
//     curalink.co.in domain -- set this one too via `supabase secrets set`.
//   VERIFICATION_REVIEW_SENDER (optional) -- defaults to
//     "CuraLink <verifications@curalink.co.in>".
import { createClient } from "npm:@supabase/supabase-js@2";
import { withSentry } from "../_shared/sentry.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const INTERNAL_TRIGGER_SECRET = Deno.env.get("INTERNAL_TRIGGER_SECRET") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SENDER = Deno.env.get("VERIFICATION_REVIEW_SENDER") ?? "CuraLink <verifications@curalink.co.in>";
const STAFF_EMAIL = "healthcarecuralink@gmail.com";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const docLabels: Record<string, string> = {
  license: "Professional license",
  id: "Government ID proof",
  bg: "Police background check",
  addr: "Address proof",
};

// docs/full_name/phone all come from a professional's own client-writable
// row (professional_credentials.docs, profiles.full_name) -- never trust
// them as-is in HTML.
const htmlEscapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => htmlEscapes[c] ?? c);
}

interface Payload {
  token: string;
  profile_id: string;
  full_name: string | null;
  phone: string | null;
  roles: string[];
  docs: { type: string; path: string }[] | null;
}

Deno.serve(withSentry(async (req) => {
  if (req.headers.get("x-internal-secret") !== INTERNAL_TRIGGER_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const { token, profile_id, full_name, phone, roles, docs } = (await req.json()) as Payload;

  // Only sign URLs for files actually inside the applicant's own folder --
  // docs.path is client-writable, so a forged path could otherwise expose
  // another professional's document via this service-role signed URL.
  const ownDocs = (docs ?? []).filter((doc) => doc.path?.startsWith(`${profile_id}/`));
  const docLinks = await Promise.all(
    ownDocs.map(async (doc) => {
      const { data } = await supabase.storage
        .from("professional-documents")
        .createSignedUrl(doc.path, 60 * 60 * 48);
      return { label: escapeHtml(docLabels[doc.type] ?? doc.type), url: data?.signedUrl ?? null };
    }),
  );

  const reviewUrl = `${SUPABASE_URL}/functions/v1/review-verification?token=${token}`;
  const docListHtml =
    docLinks.map((d) => (d.url ? `<li><a href="${d.url}">${d.label}</a></li>` : `<li>${d.label} (link unavailable)</li>`)).join("") ||
    "<li>No documents uploaded</li>";

  const safeName = escapeHtml(full_name ?? "A professional");
  const safePhone = escapeHtml(phone ?? "no phone on file");
  const safeRoles = escapeHtml(roles.join(", "));

  const html = `
    <p><strong>${safeName}</strong> (${safePhone}) applied for: ${safeRoles}.</p>
    <p>Documents submitted:</p>
    <ul>${docListHtml}</ul>
    <p><a href="${reviewUrl}">Review application &amp; approve or reject</a></p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SENDER,
      to: [STAFF_EMAIL],
      subject: `New verification request: ${full_name ?? "professional"} (${roles.join(", ")})`,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend send failed (${res.status}): ${await res.text()}`);
  }

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
}));
