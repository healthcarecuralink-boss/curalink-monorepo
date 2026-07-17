import { supabase } from "./supabaseClient";
import type { Profile } from "./types";

// Accepts a bare 10-digit Indian mobile number or an already-prefixed one and
// normalizes to E.164 ("+91XXXXXXXXXX") -- the shape Supabase Auth expects.
export function toE164IndianPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  const withCountryCode = digits.startsWith("91") && digits.length > 10 ? digits : `91${digits.slice(-10)}`;
  return `+${withCountryCode}`;
}

// MSG91's widget wants country-code+number with no "+" (e.g. "919876543210").
export function toMsg91Identifier(input: string): string {
  return toE164IndianPhone(input).replace("+", "");
}

// wa.me wants country-code+number with no "+" too (same shape as MSG91's
// identifier). Used for the teleconsult "talk on WhatsApp" handoff -- real
// in-app video needs a WebRTC provider that isn't worth setting up yet.
export function toWhatsAppLink(phone: string, message?: string): string {
  const digits = toMsg91Identifier(phone);
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

// Phone auth now goes through the MSG91 OTP Widget client-side (see each
// app's utils/msg91Widget.ts) instead of supabase.auth.signInWithOtp --
// Supabase can only verify OTPs it generated itself, so once the widget
// independently verifies the phone, this exchanges that proof for a real
// session rather than trying to feed it into verifyOtp. The verify-msg91-otp
// Edge Function re-checks the widget's access-token server-side against
// MSG91 (never trust client-reported "verified" alone), then sets a fresh
// one-time password on the Supabase user -- signInWithPhonePassword
// immediately below spends it for a real, fully-native session.
export async function verifyMsg91AccessToken(phone: string, accessToken: string): Promise<{ password: string }> {
  const { data, error } = await supabase.functions.invoke<{ password: string }>("verify-msg91-otp", {
    body: { phone: toE164IndianPhone(phone), accessToken },
  });
  if (error) throw error;
  if (!data) throw new Error("verify-msg91-otp returned no data");
  return data;
}

export async function signInWithPhonePassword(phone: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: toE164IndianPhone(phone),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// A real, timestamped, permanent record that this user accepted the Terms of
// Service + Privacy Policy at signup -- not just a UI checkbox with nothing
// behind it. Called once, right after the new session is established (see
// otp.tsx in both apps), never mutated afterward.
export async function recordConsent(profileId: string, version: string, consentType = "terms_and_privacy"): Promise<void> {
  const { error } = await supabase.from("consent_records").insert({ profile_id: profileId, version, consent_type: consentType });
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

// Applies for a professional role (README: "Verification pending" step) --
// does not grant the role by itself, an admin must approve it. See
// approve_role for the admin side, wired up in Step 10 (admin dashboard).
export async function requestRole(role: string) {
  const { error } = await supabase.rpc("request_role", { p_role: role });
  if (error) throw error;
}
