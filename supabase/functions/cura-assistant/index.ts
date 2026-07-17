// Cura Assistant reply generator.
//
// Called by the client (a real signed-in session -- this function keeps the
// platform's default JWT verification, unlike send-sms-hook/send-push-
// notification which are called by Supabase/Postgres itself) right after it
// inserts the user's message into assistant_messages. This function reads
// that message, generates a reply, and inserts it as the 'assistant' row --
// the client picks it up via the same Postgres Changes realtime subscription
// pattern as team chat, so no response body needs to carry the reply text.
//
// Required Edge Function secrets:
//   ANTHROPIC_API_KEY -- not set yet. Once it is, replace the canned-reply
//     block below (search "TODO: ANTHROPIC_API_KEY") with a real call to
//     https://api.anthropic.com/v1/messages.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withSentry } from "../_shared/sentry.ts";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function cannedReply(userMessage: string): string {
  const text = userMessage.toLowerCase();
  if (text.includes("book") || text.includes("nurse") || text.includes("doctor")) {
    return "I can help you book a visit — head to the Services tab to pick a nurse, doctor, or physio, and I'll be able to book it directly for you soon.";
  }
  if (text.includes("track") || text.includes("order") || text.includes("medicine") || text.includes("pharmacy")) {
    return "You can track any pharmacy order from Profile → Pharmacy orders. Soon I'll be able to pull up live status right here.";
  }
  if (text.includes("emergency") || text.includes("ambulance") || text.includes("sos")) {
    return "For a real emergency, please use the SOS button on your Home screen right now — it dispatches an ambulance immediately, faster than I can help here.";
  }
  return "Thanks for asking! I'm still being connected to my full assistant brain — once that's switched on I'll be able to answer this properly and take actions for you.";
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await callerClient.auth.getUser();
  if (!user) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const { conversation_id } = await req.json();

  const { data: conversation } = await adminClient
    .from("assistant_conversations")
    .select("profile_id")
    .eq("id", conversation_id)
    .maybeSingle();
  if (!conversation || conversation.profile_id !== user.id) {
    return jsonResponse({ error: "not your conversation" }, 403);
  }

  const { data: lastUserMessage } = await adminClient
    .from("assistant_messages")
    .select("content")
    .eq("conversation_id", conversation_id)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let replyText: string;
  if (!ANTHROPIC_API_KEY) {
    // TODO: ANTHROPIC_API_KEY -- once this secret is set, replace this
    // canned reply with a real call to Anthropic's Messages API using the
    // conversation history as context.
    replyText = cannedReply(lastUserMessage?.content ?? "");
  } else {
    // Real send path (dead code until ANTHROPIC_API_KEY exists).
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 512,
        messages: [{ role: "user", content: lastUserMessage?.content ?? "" }],
      }),
    });
    const data = await res.json();
    replyText = data.content?.[0]?.text ?? "Sorry, I couldn't come up with a reply just now.";
  }

  await adminClient.from("assistant_messages").insert({ conversation_id, role: "assistant", content: replyText });

  return jsonResponse({ ok: true }, 200);
}));
