// Sends a push notification for a `notifications` row.
//
// Called automatically by the trigger_push_notification trigger (see the
// push_notifications_trigger migration) whenever a row is inserted into
// public.notifications -- so the whole pipeline (device token lookup,
// per-category preference check) is real and already wired end-to-end.
// Delivery goes through FCM's HTTP v1 API (the legacy `fcm/send` + server-key
// API this function used to stub was fully decommissioned by Google) via a
// service-account JWT, using google-auth-library to handle token minting +
// caching rather than hand-rolling RS256 signing here.
//
// Required Edge Function secrets:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -- already present by default
//   INTERNAL_TRIGGER_SECRET -- shared secret the DB trigger sends back, so
//     this function only ever runs for calls that actually came from our own
//     trigger (this function has verify_jwt = false in config.toml, same
//     reasoning as send-sms-hook: the caller is Postgres, not an end user).
//   FIREBASE_SERVICE_ACCOUNT_JSON -- the full service account key JSON
//     (downloaded from Firebase console > Project settings > Service
//     accounts > Generate new private key), stored as a single-line secret.
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleAuth } from "npm:google-auth-library@9";
import { withSentry } from "../_shared/sentry.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const INTERNAL_TRIGGER_SECRET = Deno.env.get("INTERNAL_TRIGGER_SECRET") ?? "";
const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const serviceAccount = FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON) : null;
const googleAuth = serviceAccount
  ? new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    })
  : null;

interface NotificationPayload {
  profile_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
}

const preferenceColumnForType: Record<string, string> = {
  visit_update: "visit_updates",
  chat_message: "chat_messages",
  emergency_alert: "emergency_alerts",
  promotion: "promotions",
};

Deno.serve(withSentry(async (req) => {
  if (req.headers.get("x-internal-secret") !== INTERNAL_TRIGGER_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const payload: NotificationPayload = await req.json();
  const { profile_id, type, title, body, data: notificationData } = payload;

  const prefColumn = preferenceColumnForType[type] ?? "promotions";
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select(prefColumn)
    .eq("profile_id", profile_id)
    .maybeSingle();

  const isEnabled = (prefs as Record<string, boolean> | null)?.[prefColumn] ?? true;
  if (!isEnabled) {
    return new Response(JSON.stringify({ skipped: "preference disabled" }), { status: 200 });
  }

  const { data: tokens } = await supabase.from("push_tokens").select("token, platform").eq("profile_id", profile_id);
  if (!tokens || tokens.length === 0) {
    return new Response(JSON.stringify({ skipped: "no device tokens registered" }), { status: 200 });
  }

  if (!googleAuth) {
    console.log(`[send-push-notification] MOCK send to ${tokens.length} device(s):`, { title, body });
    return new Response(JSON.stringify({ mocked: true, wouldSendTo: tokens.length }), { status: 200 });
  }

  const accessToken = await googleAuth.getAccessToken();
  const projectId = serviceAccount.project_id;
  const stringData = Object.fromEntries(Object.entries(notificationData ?? {}).map(([k, v]) => [k, String(v)]));

  const results = await Promise.allSettled(
    tokens.map(async (t) => {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          message: {
            token: t.token,
            notification: { title, body: body ?? "" },
            data: stringData,
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        // Tokens FCM reports as gone (app uninstalled, token rotated) should
        // stop being retried -- clean them up rather than erroring forever.
        if (errBody.includes("UNREGISTERED") || errBody.includes("NOT_FOUND")) {
          await supabase.from("push_tokens").delete().eq("token", t.token);
        }
        throw new Error(`FCM send failed (${res.status}): ${errBody}`);
      }
      return res.json();
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => String(r.reason));
  if (failures.length > 0) {
    console.error(`[send-push-notification] ${failures.length} of ${tokens.length} send(s) failed:`, failures);
  }

  return new Response(JSON.stringify({ sent, failed: failures.length, failures }), { status: 200 });
}));
