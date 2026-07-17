import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type AssistantConversation = Database["public"]["Tables"]["assistant_conversations"]["Row"];
type AssistantMessage = Database["public"]["Tables"]["assistant_messages"]["Row"];

// One ongoing conversation per user for now (README shows Cura Assistant as
// a single chat surface, not a list of past conversations).
export async function fetchOrCreateAssistantConversation(profileId: string): Promise<AssistantConversation> {
  const { data: existing, error } = await supabase
    .from("assistant_conversations")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("assistant_conversations")
    .insert({ profile_id: profileId })
    .select()
    .single();
  if (createError) throw createError;
  return created;
}

export async function fetchAssistantMessages(conversationId: string): Promise<AssistantMessage[]> {
  const { data, error } = await supabase
    .from("assistant_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// Inserts the user's message, then asks the cura-assistant Edge Function to
// generate and insert the reply. The reply itself arrives over the realtime
// subscription (see subscribeToAssistantMessages), same pattern as team chat.
export async function sendAssistantMessage(conversationId: string, content: string): Promise<void> {
  const { error } = await supabase.from("assistant_messages").insert({ conversation_id: conversationId, role: "user", content });
  if (error) throw error;

  const { error: fnError } = await supabase.functions.invoke("cura-assistant", {
    body: { conversation_id: conversationId },
  });
  if (fnError) throw fnError;
}

export function subscribeToAssistantMessages(conversationId: string, onInsert: (message: AssistantMessage) => void) {
  return supabase
    .channel(`assistant_messages:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "assistant_messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(payload.new as AssistantMessage),
    )
    .subscribe();
}
