import { OTPWidget } from "@msg91comm/sendotp-react-native";
import { toMsg91Identifier } from "@curalink/api-client";

const WIDGET_ID = process.env.EXPO_PUBLIC_MSG91_WIDGET_ID ?? "";
const TOKEN_AUTH = process.env.EXPO_PUBLIC_MSG91_WIDGET_AUTH_TOKEN ?? "";

let initialized = false;

// Widget ID / auth token are meant to be client-embedded (MSG91's own web
// widget ships them inline in a <script> tag) -- unlike MSG91_AUTH_KEY, which
// must stay server-only. Safe to call repeatedly; only initializes once.
export function ensureMsg91WidgetInitialized(): void {
  if (initialized) return;
  OTPWidget.initializeWidget(WIDGET_ID, TOKEN_AUTH);
  initialized = true;
}

interface Msg91Response {
  type?: string;
  message?: string;
}

// Returns the reqId needed for verifyMsg91Otp/retryMsg91Otp.
export async function sendMsg91Otp(phone: string): Promise<string> {
  ensureMsg91WidgetInitialized();
  const response = (await OTPWidget.sendOTP({ identifier: toMsg91Identifier(phone) })) as Msg91Response;
  if (response?.type !== "success" || !response.message) {
    throw new Error(response?.message ?? "Couldn't send the verification code. Try again.");
  }
  return response.message;
}

export async function retryMsg91Otp(reqId: string): Promise<void> {
  ensureMsg91WidgetInitialized();
  const response = (await OTPWidget.retryOTP({ reqId, retryChannel: 11 })) as Msg91Response;
  if (response?.type !== "success") {
    throw new Error(response?.message ?? "Couldn't resend the code. Try again.");
  }
}

// Returns the access-token that must be re-verified server-side (see
// verifyMsg91AccessToken in @curalink/api-client) before it's trusted.
export async function verifyMsg91Otp(reqId: string, otp: string): Promise<string> {
  ensureMsg91WidgetInitialized();
  const response = (await OTPWidget.verifyOTP({ reqId, otp })) as Msg91Response;
  if (response?.type !== "success" || !response.message) {
    throw new Error(response?.message ?? "Incorrect code. Try again.");
  }
  return response.message;
}
