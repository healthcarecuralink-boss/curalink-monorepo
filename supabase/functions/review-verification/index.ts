// Lets CuraLink staff approve or reject a professional's application from
// the link in the verification email (send-verification-email), without
// logging into the app or touching SQL. GET only renders a page -- no
// mutation happens on a plain link visit, since corporate mail scanners
// (e.g. Outlook Safe Links) auto-fetch every link in an email, and that
// would otherwise silently approve/reject before a human ever looks. The
// actual decision only happens on the POST fired by a real button click on
// that rendered page.
//
// Deployed with --no-verify-jwt: opened directly by a human clicking an
// emailed link, so there's no Supabase session at all.
//
// Required Edge Function secrets:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -- present by default.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withSentry } from "../_shared/sentry.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const docLabels: Record<string, string> = {
  license: "Professional license",
  id: "Government ID proof",
  bg: "Police background check",
  addr: "Address proof",
};

// full_name/phone/doc types all come from a professional's own
// client-writable row -- never trust them as-is in HTML.
const htmlEscapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => htmlEscapes[c] ?? c);
}

function page(body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CuraLink verification review</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; color: #1a1a1a; }
  a { color: #0F7A5E; }
  ul { padding-left: 20px; }
  button { font-size: 16px; padding: 10px 20px; border-radius: 8px; border: none; color: #fff; cursor: pointer; margin-right: 8px; }
  .approve { background: #0F7A5E; }
  .reject { background: #C0392B; }
</style>
</head><body>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function renderReviewForm(token: string) {
  const { data: tokenRow } = await supabase
    .from("verification_review_tokens")
    .select("profile_id, roles, used_at, expires_at, action")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) return page("<p>This review link is invalid.</p>", 404);
  if (tokenRow.used_at) {
    return page(
      `<p>This application was already <strong>${escapeHtml(tokenRow.action ?? "processed")}</strong> on ${new Date(tokenRow.used_at).toLocaleString()}.</p>`,
    );
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return page("<p>This review link has expired. Approve/reject it from the Supabase SQL editor instead.</p>", 410);
  }

  const [{ data: profile }, { data: credentials }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", tokenRow.profile_id).maybeSingle(),
    supabase.from("professional_credentials").select("docs").eq("profile_id", tokenRow.profile_id).maybeSingle(),
  ]);

  const docs = ((credentials?.docs as { type: string; path: string }[] | null) ?? []).filter((doc) =>
    doc.path?.startsWith(`${tokenRow.profile_id}/`),
  );
  const docLinks = await Promise.all(
    docs.map(async (doc) => {
      const { data } = await supabase.storage.from("professional-documents").createSignedUrl(doc.path, 60 * 60 * 48);
      return { label: escapeHtml(docLabels[doc.type] ?? doc.type), url: data?.signedUrl ?? null };
    }),
  );
  const docListHtml =
    docLinks
      .map((d) => (d.url ? `<li><a href="${d.url}" target="_blank" rel="noopener">${d.label}</a></li>` : `<li>${d.label} (link unavailable)</li>`))
      .join("") || "<li>No documents uploaded</li>";

  return page(`
    <h2>${escapeHtml(profile?.full_name ?? "Unknown applicant")}</h2>
    <p>${escapeHtml(profile?.phone ?? "no phone on file")} &middot; applied for: ${escapeHtml(tokenRow.roles.join(", "))}</p>
    <p>Documents:</p>
    <ul>${docListHtml}</ul>
    <form method="POST">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <button class="approve" name="action" value="approved">Approve</button>
      <button class="reject" name="action" value="rejected">Reject</button>
    </form>
  `);
}

Deno.serve(withSentry(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const token = url.searchParams.get("token");
    if (!token) return page("<p>Missing review token.</p>", 400);
    return renderReviewForm(token);
  }

  if (req.method === "POST") {
    const form = await req.formData();
    const token = String(form.get("token") ?? "");
    const action = String(form.get("action") ?? "");
    if (!token || (action !== "approved" && action !== "rejected")) {
      return page("<p>Invalid request.</p>", 400);
    }

    const { error } = await supabase.rpc("consume_verification_token", { p_token: token, p_action: action });
    if (error) {
      return page(`<p>Could not process this application: ${escapeHtml(error.message)}</p>`, 400);
    }

    return page(`<p><strong>${action === "approved" ? "Approved" : "Rejected"}.</strong> You can close this page.</p>`);
  }

  return page("<p>Method not allowed.</p>", 405);
}));
