// ⚠️ DEPRECATED / DISABLED -- MSG91 is retired. Login now uses WhatsApp OTP
// (server-side: send-whatsapp-otp + verify-whatsapp-otp). The send_sms hook is
// disabled in config.toml, so this function no longer runs. Kept for reference.
//
// Supabase Auth "Send SMS" hook.
//
// Supabase Auth still owns OTP generation and verification (via
// auth.signInWithOtp / auth.verifyOtp on the client) -- this hook is called
// once, right before an OTP would normally be sent through the built-in
// SMS provider (Twilio), and is responsible ONLY for delivering that
// already-generated code via MSG91 instead. It must not call MSG91's own
// OTP-verify endpoint; verification stays with Supabase.
//
// Configure in the Dashboard: Authentication > Hooks > Send SMS hook,
// pointing at this function's URL. Registering the hook there is what
// generates the signing secret -- set it as the SEND_SMS_HOOK_SECRET
// function secret (see README below for the full setup checklist).
//
// Required Edge Function secrets:
//   MSG91_AUTH_KEY      -- MSG91 account auth key (already set)
//   MSG91_TEMPLATE_ID   -- DLT-approved OTP template ID from the MSG91 dashboard
//   SEND_SMS_HOOK_SECRET -- the "Webhook secret" shown when the hook is enabled
import { Webhook } from "npm:standardwebhooks@1.0.0";
import { withSentry } from "../_shared/sentry.ts";

const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY") ?? "";
const MSG91_TEMPLATE_ID = Deno.env.get("MSG91_TEMPLATE_ID") ?? "";
const HOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET") ?? "";

interface SendSmsHookPayload {
  user: { id: string; phone?: string };
  sms: { otp: string };
}

function hookError(httpCode: number, message: string) {
  return new Response(JSON.stringify({ error: { http_code: httpCode, message } }), {
    status: httpCode,
    headers: { "Content-Type": "application/json" },
  });
}

// MSG91 expects the mobile number as country-code + number with no "+"
// (e.g. "919876543210"). Supabase stores phone as E.164 without "+" already
// for most providers, but we normalize defensively either way.
function toMsg91Mobile(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.startsWith("91") ? digits : `91${digits}`;
}

Deno.serve(withSentry(async (req) => {
  const rawBody = await req.text();

  try {
    const wh = new Webhook(HOOK_SECRET);
    wh.verify(rawBody, Object.fromEntries(req.headers));
  } catch {
    return hookError(401, "Invalid hook signature");
  }

  let payload: SendSmsHookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return hookError(400, "Invalid JSON payload");
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;

  if (!phone || !otp) {
    return hookError(400, "Missing user.phone or sms.otp in hook payload");
  }

  if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
    return hookError(500, "MSG91_AUTH_KEY or MSG91_TEMPLATE_ID is not configured");
  }

  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", MSG91_TEMPLATE_ID);
  url.searchParams.set("mobile", toMsg91Mobile(phone));
  url.searchParams.set("authkey", MSG91_AUTH_KEY);
  url.searchParams.set("otp", otp);
  url.searchParams.set("otp_length", String(otp.length));

  let msg91Response: { type?: string; message?: string };
  try {
    const res = await fetch(url.toString(), { method: "POST" });
    msg91Response = await res.json();
  } catch (err) {
    return hookError(500, `Failed to reach MSG91: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (msg91Response.type !== "success") {
    return hookError(500, `MSG91 rejected the OTP send: ${msg91Response.message ?? "unknown error"}`);
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}));
