// Verifies a WhatsApp login OTP (issued by send-whatsapp-otp) and exchanges it
// for a real Supabase Auth session.
//
// Supabase's native phone auth can only verify an OTP Supabase itself
// generated, so -- exactly like the old verify-msg91-otp bridge -- this does
// NOT feed the code into verifyOtp. Once the code checks out against the hash
// we stored, it sets a fresh one-time random password on the Supabase user via
// the admin API and hands it back; the client immediately spends it with
// signInWithPassword({ phone, password }) for a fully-native session.
//
// Security: the code is short-lived, hashed at rest, single-use (deleted on
// success), attempt-capped, and only reachable by the service role. A client
// can't brute-force it (5 tries) and can't read the hash (RLS deny-all).
//
// Deployed with --no-verify-jwt: the caller is a pre-session user.
//
// Required Edge Function secrets:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -- present by default.
//   OTP_PEPPER (optional) -- must match send-whatsapp-otp's value.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withSentry } from "../_shared/sentry.ts";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import { hashOtp, randomPassword, timingSafeEqual, toE164IndianPhone, toStoredPhone } from "../_shared/otp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const MAX_ATTEMPTS = 5;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface VerifyRequestBody {
  phone: string;
  otp: string;
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

  const { phone, otp } = payload;
  if (!phone || !otp) {
    return jsonResponse({ error: "Missing phone or otp" }, 400);
  }

  const storedPhone = toStoredPhone(phone);

  const { data: row, error: readError } = await supabase
    .from("phone_otps")
    .select("otp_hash, expires_at, attempts")
    .eq("phone", storedPhone)
    .maybeSingle();
  if (readError) {
    return jsonResponse({ error: readError.message }, 500);
  }
  if (!row) {
    return jsonResponse({ error: "No code was requested for this number. Request a new one." }, 401);
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabase.from("phone_otps").delete().eq("phone", storedPhone);
    return jsonResponse({ error: "This code has expired. Request a new one." }, 401);
  }

  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
    await supabase.from("phone_otps").delete().eq("phone", storedPhone);
    return jsonResponse({ error: "Too many incorrect attempts. Request a new code." }, 429);
  }

  const candidateHash = await hashOtp(otp.replace(/[^\d]/g, ""));
  if (!timingSafeEqual(candidateHash, row.otp_hash)) {
    await supabase
      .from("phone_otps")
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq("phone", storedPhone);
    return jsonResponse({ error: "Incorrect code. Try again." }, 401);
  }

  // Correct code: burn it immediately so it can't be replayed.
  await supabase.from("phone_otps").delete().eq("phone", storedPhone);

  const e164Phone = toE164IndianPhone(phone);
  const password = randomPassword();

  // Supabase Auth stores phone without the leading "+", and a trigger copies it
  // into profiles.phone in that same format -- so an existing user is found by
  // the storedPhone, and only a genuinely new number falls to createUser.
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
