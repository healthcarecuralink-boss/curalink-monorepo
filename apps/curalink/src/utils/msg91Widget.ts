// ⚠️ DEPRECATED / DISABLED -- MSG91 OTP has been retired.
//
// Phone login now goes through WhatsApp (Meta Cloud API), fully server-side:
//   - send:   sendPhoneOtp / resendPhoneOtp  (@curalink/api-client)
//   - verify: verifyPhoneOtp                 (@curalink/api-client)
//   - backend: supabase/functions/send-whatsapp-otp + verify-whatsapp-otp
//
// This file is intentionally kept (not deleted) as a nerfed stub so history and
// any stray import resolve, but every export throws -- nothing here should run
// anymore. Delete once you're confident no build references it.
//
// Original implementation: see git history for the MSG91 OTP Widget wrapper
// (@msg91comm/sendotp-react-native).

const DEPRECATED = "MSG91 OTP is disabled. Use the WhatsApp OTP flow (sendPhoneOtp / verifyPhoneOtp in @curalink/api-client).";

export function ensureMsg91WidgetInitialized(): void {
  throw new Error(DEPRECATED);
}

export function sendMsg91Otp(_phone: string): Promise<string> {
  throw new Error(DEPRECATED);
}

export function retryMsg91Otp(_reqId: string): Promise<void> {
  throw new Error(DEPRECATED);
}

export function verifyMsg91Otp(_reqId: string, _otp: string): Promise<string> {
  throw new Error(DEPRECATED);
}
