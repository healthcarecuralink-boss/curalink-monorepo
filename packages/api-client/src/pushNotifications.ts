import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type NotificationPreferences = Database["public"]["Tables"]["notification_preferences"]["Row"];
type NotificationPreferencesUpdate = Database["public"]["Tables"]["notification_preferences"]["Update"];

export async function registerPushToken(
  profileId: string,
  token: string,
  platform: Database["public"]["Tables"]["push_tokens"]["Row"]["platform"],
): Promise<void> {
  const { error } = await supabase.from("push_tokens").upsert({ profile_id: profileId, token, platform }, { onConflict: "token" });
  if (error) throw error;
}

export async function unregisterPushToken(token: string): Promise<void> {
  const { error } = await supabase.from("push_tokens").delete().eq("token", token);
  if (error) throw error;
}

export async function fetchNotificationPreferences(profileId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateNotificationPreferences(profileId: string, patch: NotificationPreferencesUpdate): Promise<void> {
  const { error } = await supabase.from("notification_preferences").update(patch).eq("profile_id", profileId);
  if (error) throw error;
}
