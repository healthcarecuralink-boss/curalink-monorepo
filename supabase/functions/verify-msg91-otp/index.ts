// Bridges MSG91's OTP Widget (client-side, independent OTP generation +
// verification -- skips DLT entirely, unlike the raw SendOTP API the old
// send-sms-hook used) to a real Supabase Auth session.
//
// Supabase's native phone auth (signInWithOtp/verifyOtp) can only verify an
// OTP that Supabase itself generated -- there's no supported way to hand it
// a third party's already-verified result. So this function does NOT try to
// make Supabase "accept" the widget's verification directly. Instead, once
// MSG91 independently confirms (server-to-server, via this function) that
// the widget's access-token is genuine, it sets a fresh one-time random
// password on the Supabase user via the admin API and hands it back to the
// client, which immediately calls the client's normal, fully-native
// supabase.auth.signInWithPassword({ phone, password }) -- a real session,
// no custom JWT signing or session-refresh reinvention needed.
//
// Security: the client cannot forge a valid access-token for a phone number
// it doesn't control -- MSG91 only issues one after that specific phone
// actually received and confirmed the OTP. This function's own server-side
// call to MSG91 (using the account Authkey, never exposed to the client) is
// what makes that trustworthy; the client-supplied `phone` is just used to
// find/create the matching Supabase user afterward.
//
// Deployed with --no-verify-jwt: callers are anonymous, pre-session users
// (this IS the login step), so there's no user JWT to check yet. MSG91's own
// verification is the real gate here, not a shared secret.
//
// Required Edge Function secrets:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -- already present by default
//   MSG91_AUTH_KEY -- MSG91 account Authkey (Settings > Authkey), NOT the
//     widget's tokenAuth -- these are two different credentials.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withSentry } from "../_shared/sentry.ts";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface VerifyRequestBody {
  phone: string;
  accessToken: string;
}

function randomPassword(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
}

// Supabase wants E.164 ("+91XXXXXXXXXX"); normalizes defensively regardless
// of whether the client already prefixed it.
function toE164IndianPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  const withCountryCode = digits.startsWith("91") && digits.length > 10 ? digits : `91${digits.slice(-10)}`;
  return `+${withCountryCode}`;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(withSentry(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  let payload: VerifyRequestBody;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { phone, accessToken } = payload;
  if (!phone || !accessToken) {
    return jsonResponse({ error: "Missing phone or accessToken" }, 400);
  }

  if (!MSG91_AUTH_KEY) {
    return jsonResponse({ error: "MSG91_AUTH_KEY is not configured" }, 500);
  }

  let verifyBody: { type?: string; message?: unknown };
  try {
    const verifyRes = await fetch("https://api.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { authkey: MSG91_AUTH_KEY, "content-type": "application/json" },
      body: JSON.stringify({ "access-token": accessToken }),
    });
    verifyBody = await verifyRes.json();
  } catch (err) {
    return jsonResponse({ error: `Failed to reach MSG91: ${err instanceof Error ? err.message : String(err)}` }, 500);
  }

  if (verifyBody.type !== "success") {
    return jsonResponse({ error: "MSG91 rejected the access token", detail: verifyBody }, 401);
  }

  const e164Phone = toE164IndianPhone(phone);
  const password = randomPassword();

  // Supabase Auth stores phone without the leading "+" regardless of what
  // format is passed to admin.createUser (confirmed empirically -- passing
  // "+91XXXXXXXXXX" still lands as "91XXXXXXXXXX" in both auth.users.phone
  // and the profiles row a trigger copies it into). profiles.phone must be
  // queried in that same stored format, or an existing user is never found
  // and every login after the first would incorrectly hit the "create a new
  // user" branch below, which fails outright since the phone is already
  // registered.
  const storedPhone = e164Phone.replace("+", "");

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", storedPhone)
    .maybeSingle();
  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }

  if (existingProfile) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingProfile.id, { password });
    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }
  } else {
    const { error: createError } = await supabase.auth.admin.createUser({
      phone: e164Phone,
      phone_confirm: true,
      password,
    });
    if (createError) {
      return jsonResponse({ error: createError.message }, 500);
    }
  }

  return jsonResponse({ password }, 200);
}));
