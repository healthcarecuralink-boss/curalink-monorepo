// Sends a login OTP over WhatsApp (Meta Cloud API) and records its hash so
// verify-whatsapp-otp can check it later.
//
// Why this exists (vs. the old MSG91 widget): MSG91's widget generated AND
// verified the OTP client-side. WhatsApp Cloud API only *delivers* a message,
// so the whole OTP lifecycle now lives server-side -- generated here, stored
// hashed in public.phone_otps, verified by verify-whatsapp-otp. That's more
// code but it's fully under our control and free of MSG91's DLT/wallet/widget
// quirks.
//
// Deployed with --no-verify-jwt: callers are anonymous, pre-session users
// (this IS the login step), so there's no user JWT yet.
//
// Required Edge Function secrets (set via `supabase secrets set`):
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -- present by default.
//   WHATSAPP_TOKEN           -- permanent System-User token with
//                               whatsapp_business_messaging (NOT the 24h temp
//                               token, which expires). Server-only.
//   WHATSAPP_PHONE_NUMBER_ID -- the sending number's Phone Number ID.
//   WHATSAPP_OTP_TEMPLATE_NAME -- an approved Authentication-category template.
//   WHATSAPP_OTP_TEMPLATE_LANG -- that template's language code (e.g. "en").
//   OTP_PEPPER (optional)    -- extra secret mixed into the OTP hash.
//
// If WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID are unset the function runs in
// mock mode: it still generates + stores a real OTP but logs it to the console
// instead of sending a WhatsApp message, so local/dev login works before Meta
// credentials are wired up. Mock mode is refused unless OTP_ALLOW_MOCK=1, so a
// misconfigured production deploy fails loudly instead of silently printing
// codes to a log.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withSentry } from "../_shared/sentry.ts";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import { generateOtp, hashOtp, toStoredPhone } from "../_shared/otp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const WHATSAPP_OTP_TEMPLATE_NAME = Deno.env.get("WHATSAPP_OTP_TEMPLATE_NAME") ?? "";
const WHATSAPP_OTP_TEMPLATE_LANG = Deno.env.get("WHATSAPP_OTP_TEMPLATE_LANG") ?? "en";
const GRAPH_VERSION = Deno.env.get("WHATSAPP_GRAPH_VERSION") ?? "v22.0";
const ALLOW_MOCK = Deno.env.get("OTP_ALLOW_MOCK") === "1";

// OTP lifetime + throttles. Kept deliberately conservative for an SMS-grade
// auth factor.
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // min gap between two sends to one number
const SEND_WINDOW_MS = 60 * 60 * 1000; // rolling window for the send cap
const MAX_SENDS_PER_WINDOW = 5;

const isMockMode = !WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface SendRequestBody {
  phone: string;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function sendWhatsAppOtp(toPhone: string, otp: string): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toPhone,
      type: "template",
      template: {
        name: WHATSAPP_OTP_TEMPLATE_NAME,
        language: { code: WHATSAPP_OTP_TEMPLATE_LANG },
        // Authentication templates need the code in BOTH the body (the visible
        // "<code> is your verification code" line) and the copy-code button.
        components: [
          { type: "body", parameters: [{ type: "text", text: otp }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: otp }] },
        ],
      },
    }),
  });
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    throw new Error(`WhatsApp send failed (${res.status}): ${JSON.stringify(detail)}`);
  }
}

Deno.serve(withSentry(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (isMockMode && !ALLOW_MOCK) {
    // Loud failure instead of silently printing codes -- mirrors the msg91Widget
    // __DEV__ gate: a prod build with missing WhatsApp creds must not "work".
    return jsonResponse({ error: "OTP delivery isn't configured (missing WhatsApp credentials)." }, 500);
  }

  let payload: SendRequestBody;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload.phone) {
    return jsonResponse({ error: "Missing phone" }, 400);
  }

  const storedPhone = toStoredPhone(payload.phone);
  const now = Date.now();

  const { data: existing, error: readError } = await supabase
    .from("phone_otps")
    .select("last_sent_at, send_count, window_started_at")
    .eq("phone", storedPhone)
    .maybeSingle();
  if (readError) {
    return jsonResponse({ error: readError.message }, 500);
  }

  // Throttle: enforce a per-number resend cooldown and a rolling send cap.
  let sendCount = 1;
  let windowStartedAt = new Date(now);
  if (existing) {
    const lastSent = new Date(existing.last_sent_at).getTime();
    if (now - lastSent < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSent)) / 1000);
      return jsonResponse({ error: `Please wait ${waitSec}s before requesting another code.` }, 429);
    }
    const windowStart = new Date(existing.window_started_at).getTime();
    if (now - windowStart < SEND_WINDOW_MS) {
      if ((existing.send_count ?? 0) >= MAX_SENDS_PER_WINDOW) {
        return jsonResponse({ error: "Too many codes requested. Try again later." }, 429);
      }
      sendCount = (existing.send_count ?? 0) + 1;
      windowStartedAt = new Date(windowStart);
    }
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const nowIso = new Date(now).toISOString();

  const { error: upsertError } = await supabase.from("phone_otps").upsert({
    phone: storedPhone,
    otp_hash: otpHash,
    expires_at: new Date(now + OTP_TTL_MS).toISOString(),
    attempts: 0,
    send_count: sendCount,
    window_started_at: windowStartedAt.toISOString(),
    last_sent_at: nowIso,
  });
  if (upsertError) {
    return jsonResponse({ error: upsertError.message }, 500);
  }

  if (isMockMode) {
    console.warn(`[send-whatsapp-otp] MOCK MODE -- OTP for ${storedPhone} is ${otp} (no WhatsApp message sent).`);
    return jsonResponse({ sent: true, mock: true }, 200);
  }

  try {
    await sendWhatsAppOtp(storedPhone, otp);
  } catch (err) {
    // Don't leave a live hash around for a code that never reached the user.
    await supabase.from("phone_otps").delete().eq("phone", storedPhone);
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 502);
  }

  return jsonResponse({ sent: true }, 200);
}));
