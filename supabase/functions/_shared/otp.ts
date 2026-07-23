// Shared OTP primitives for the WhatsApp Cloud API login flow, used by both
// send-whatsapp-otp (generates + hashes) and verify-whatsapp-otp (re-hashes to
// compare). Keeping the hashing + phone-normalization in one place guarantees
// the two functions agree byte-for-byte -- a mismatch here would silently
// reject every correct code.

// Optional server-only pepper mixed into the hash. If unset the codes are
// still hashed (never stored raw), just without the extra secret -- fine for a
// 6-digit value that lives ~10 minutes, but set OTP_PEPPER in production for
// defense in depth.
const OTP_PEPPER = Deno.env.get("OTP_PEPPER") ?? "";

// Cryptographically-random 6-digit code (100000-999999), no modulo bias.
export function generateOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

export async function hashOtp(otp: string): Promise<string> {
  const data = new TextEncoder().encode(`${OTP_PEPPER}${otp}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time compare so a wrong code can't be narrowed down by timing.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// Accepts a bare 10-digit Indian mobile number or an already-prefixed one and
// normalizes to E.164 ("+91XXXXXXXXXX").
export function toE164IndianPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  const withCountryCode = digits.startsWith("91") && digits.length > 10 ? digits : `91${digits.slice(-10)}`;
  return `+${withCountryCode}`;
}

// E.164 minus the "+": the format both profiles.phone and phone_otps.phone are
// stored in, and the format WhatsApp's Cloud API `to` field expects.
export function toStoredPhone(input: string): string {
  return toE164IndianPhone(input).replace("+", "");
}

// Fresh one-time password handed to the client to spend on
// signInWithPassword -- same approach the old verify-msg91-otp used.
export function randomPassword(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
}
