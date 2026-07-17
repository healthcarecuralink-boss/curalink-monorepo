// supabase-js wraps some Auth Hook failures (e.g. our MSG91 send-sms-hook
// returning non-200) as AuthRetryableFetchError with message "{}" -- the
// hook's actual error detail doesn't survive the client's error parsing.
// Fall back to a friendly message rather than showing "{}" to the user.
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message && err.message !== "{}") {
    return err.message;
  }
  return "Something went wrong. Please try again in a moment.";
}
