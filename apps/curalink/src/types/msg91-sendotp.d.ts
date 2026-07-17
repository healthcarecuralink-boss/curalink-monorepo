// The real @msg91comm/sendotp-react-native package ships raw, type-broken
// .ts/.tsx source as its "main" (not compiled output + .d.ts), which fails
// `tsc --noEmit` on its own internal errors -- skipLibCheck doesn't help
// since those are .ts/.tsx source files, not .d.ts declaration files. This
// file is redirected to via tsconfig's `paths` for type-checking only;
// Metro/Babel still bundles the real package's actual JS at runtime.
interface Msg91WidgetResponse {
  type?: string;
  message?: string;
}

export class OTPWidget {
  static initializeWidget(widgetId: string, tokenAuth: string): Promise<void>;
  static sendOTP(body: { identifier: string }): Promise<Msg91WidgetResponse>;
  static verifyOTP(body: { reqId: string; otp: string }): Promise<Msg91WidgetResponse>;
  static retryOTP(body: { reqId: string; retryChannel?: number }): Promise<Msg91WidgetResponse>;
  static getWidgetProcess(): Promise<unknown>;
}
