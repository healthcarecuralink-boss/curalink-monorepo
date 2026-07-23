import * as Linking from "expo-linking";
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

// Phone auth now goes through WhatsApp (Meta Cloud API), server-side: the
// backend generates the OTP, delivers it over WhatsApp, and verifies it. See
// supabase/functions/send-whatsapp-otp + verify-whatsapp-otp. The three
// functions below are the client's whole surface for it.
//
// Unlike the old MSG91 widget, nothing OTP-related runs on the client anymore
// (no widget SDK, no client-embedded credentials, no reqId to thread through
// the navigation) -- the phone number is the only key, and the edge functions
// own generation, delivery, throttling, and verification.

// Requests a fresh OTP be sent to `phone` over WhatsApp. In dev/mock mode the
// edge function logs the code to its console instead of sending a message.
export async function sendPhoneOtp(phone: string): Promise<void> {
  const { error } = await supabase.functions.invoke("send-whatsapp-otp", {
    body: { phone: toE164IndianPhone(phone) },
  });
  if (error) throw await toInvokeError(error, "Couldn't send the verification code. Try again.");
}

// Resend is just another send -- the backend's resend cooldown + send cap
// (see send-whatsapp-otp) govern how often this is allowed.
export async function resendPhoneOtp(phone: string): Promise<void> {
  return sendPhoneOtp(phone);
}

// Verifies the code and, on success, returns the one-time password to spend on
// signInWithPhonePassword below (same session-bridge pattern as before).
export async function verifyPhoneOtp(phone: string, otp: string): Promise<{ password: string }> {
  const { data, error } = await supabase.functions.invoke<{ password: string }>("verify-whatsapp-otp", {
    body: { phone: toE164IndianPhone(phone), otp },
  });
  if (error) throw await toInvokeError(error, "Incorrect code. Try again.");
  if (!data?.password) throw new Error("verify-whatsapp-otp returned no data");
  return data;
}

// supabase.functions.invoke wraps non-2xx responses in a FunctionsHttpError
// whose useful message is in the JSON body, not error.message ("Edge Function
// returned a non-2xx status code"). Pull the server's own message out so the
// UI shows "Incorrect code" / "Please wait 30s" instead of that generic text.
async function toInvokeError(error: unknown, fallback: string): Promise<Error> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.json();
      if (body?.error) return new Error(body.error);
    } catch {
      // body wasn't JSON -- fall through to the fallback.
    }
  }
  if (error instanceof Error && error.message) return new Error(error.message);
  return new Error(fallback);
}

// --- Interim email OTP -------------------------------------------------------
// A stopgap login while WhatsApp OTP waits on Meta Business Verification (the
// authentication-template gate). Unlike phone, Supabase does email OTP natively
// end-to-end -- it generates the code, emails it, and verifyOtp establishes the
// session directly (no password-bridge / edge function needed). Needs zero Meta
// setup, so it works today.
//
// Dashboard prerequisite: the "Magic Link" email template must send the numeric
// code, i.e. include `{{ .Token }}` (Supabase Auth -> Email Templates), or users
// get a magic link instead of the 6-digit code these screens expect.

export async function sendEmailOtp(email: string, name?: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    // Returning and new users both land here -- the number/email is the account,
    // same single-entry-point philosophy as the phone flow.
    // `data.full_name` seeds raw_user_meta_data so the handle_new_user() trigger
    // (see supabase/migrations) writes the real name on first insert instead of
    // its "New user" fallback -- otherwise the profiles row briefly (and for
    // returning-session caches, indefinitely) shows that placeholder.
    options: { shouldCreateUser: true, data: name?.trim() ? { full_name: name.trim() } : undefined },
  });
  if (error) throw error;
}

export async function resendEmailOtp(email: string, name?: string): Promise<void> {
  return sendEmailOtp(email, name);
}

// Unlike verifyPhoneOtp, this doesn't return a password -- verifyOtp itself sets
// the Supabase session, so callers skip signInWithPhonePassword and go straight
// to the post-login profile/consent/routing steps.
export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });
  if (error) throw error;
}

// @deprecated MSG91 is retired -- replaced by the WhatsApp flow above. Kept as
// a loud stub so any lingering caller fails obviously instead of silently
// hitting the disabled verify-msg91-otp function. See sendPhoneOtp /
// verifyPhoneOtp.
export async function verifyMsg91AccessToken(_phone: string, _accessToken: string): Promise<{ password: string }> {
  throw new Error("verifyMsg91AccessToken is deprecated. Use verifyPhoneOtp (WhatsApp OTP) instead.");
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

// Browser-based OAuth via Supabase (no native Google Sign-In SDK, no
// SHA-1/keystore setup) -- opens Google's account picker in a browser tab,
// then Supabase redirects back into the app via its registered `scheme`
// (see app.json). Requires the Google provider configured in the Supabase
// dashboard (Authentication -> Providers -> Google) and this redirect URL
// allow-listed there (Authentication -> URL Configuration).
//
// Deliberately does NOT try to read the code from this promise's own
// result -- device testing showed that unreliable (empty/bare URL back from
// openAuthSessionAsync no matter how it's parsed). Instead, a root-level
// Linking listener (see createSessionFromUrl + _layout.tsx in each app)
// catches the curalink://auth-callback redirect independently of this
// promise or of which screen Expo Router happens to be showing when it
// lands -- that's the one thing that's actually proven to work on this
// device. This function's only remaining job is opening the browser and
// detecting an explicit user cancel.
export async function signInWithGoogle(): Promise<void> {
  // Imported lazily -- expo-web-browser is only needed for this one Google
  // sign-in flow (curalink app), but this whole file is loaded eagerly by
  // every app that imports @curalink/api-client. A top-level import here
  // crashed curalink-plus at boot, which never links this native module
  // since it doesn't offer Google sign-in.
  const WebBrowser = await import("expo-web-browser");
  const redirectTo = Linking.createURL("auth-callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Couldn't start Google sign-in.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" && result.type !== "dismiss") {
    throw new Error("Google sign-in was cancelled.");
  }
}

// The actual completion of the Google flow: called from a root-level
// Linking event listener with whatever URL the OS handed the app.
// no-ops silently on any URL that isn't this specific callback (e.g. other
// deep links), so it's safe to run unconditionally on every incoming URL.
export async function createSessionFromUrl(url: string): Promise<void> {
  // Supabase can deliver the result two ways depending on flow type:
  // PKCE puts ?code= in the query string; the implicit flow (and most
  // errors) use the URL *fragment* (#access_token=... / #error=...).
  // Parse both so the handler works regardless.
  const [withoutFragment, fragment = ""] = url.split("#");
  const { queryParams } = Linking.parse(withoutFragment ?? url);
  const fragmentParams = new URLSearchParams(fragment);

  const errorDescription =
    fragmentParams.get("error_description") ??
    fragmentParams.get("error") ??
    (typeof queryParams?.error_description === "string" ? queryParams.error_description : undefined) ??
    (typeof queryParams?.error === "string" ? queryParams.error : undefined);
  if (errorDescription) {
    throw new Error(`Google sign-in failed: ${errorDescription.replaceAll("+", " ")}`);
  }

  const code = typeof queryParams?.code === "string" ? queryParams.code : undefined;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const accessToken = fragmentParams.get("access_token");
  const refreshToken = fragmentParams.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return;
  }

  // Not an auth-callback URL (or nothing useful in it) -- ignore.
}

// For the optional "add your number" step after a Google sign-in. Deliberately
// NOT OTP-verified -- it's contact info for a Google-authenticated account,
// not a second auth factor, so this just writes straight to the profile.
// profiles.phone is unique, so a number already linked elsewhere throws.
export async function updatePhoneNumber(profileId: string, phone: string): Promise<void> {
  const storedPhone = toE164IndianPhone(phone).replace("+", "");
  const { error } = await supabase.from("profiles").update({ phone: storedPhone }).eq("id", profileId);
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

// Google sign-in reuses the same account for every future login (unlike
// phone signup, which only ever calls recordConsent once at account
// creation) -- check first so a returning user doesn't get a fresh
// consent_records row logged on every sign-in.
export async function hasRecordedConsent(profileId: string): Promise<boolean> {
  const { data, error } = await supabase.from("consent_records").select("id").eq("profile_id", profileId).limit(1).maybeSingle();
  if (error) throw error;
  return Boolean(data);
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
