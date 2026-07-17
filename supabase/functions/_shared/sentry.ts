// Shared Sentry wiring for Edge Functions. Folders prefixed with "_" aren't
// deployed as their own function -- this is only ever imported, never served
// directly.
import * as Sentry from "npm:@sentry/deno@10";

let initialized = false;

function initSentry() {
  if (initialized) return;
  const dsn = Deno.env.get("SENTRY_DSN");
  if (dsn) Sentry.init({ dsn, tracesSampleRate: 0 });
  initialized = true;
}

// Wraps a Deno.serve handler so an uncaught exception is reported to Sentry
// before falling back to a generic 500, instead of just silently showing up
// as an unlabelled crash in the function's logs. Edge Function isolates are
// short-lived, so the event must be explicitly flushed before returning --
// otherwise it can be dropped when the isolate tears down right after.
export function withSentry(
  handler: (req: Request) => Promise<Response> | Response,
): (req: Request) => Promise<Response> {
  initSentry();
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      const eventId = Sentry.captureException(err);
      await Sentry.flush(2000);
      console.error("Unhandled error, reported to Sentry:", eventId, err);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}
