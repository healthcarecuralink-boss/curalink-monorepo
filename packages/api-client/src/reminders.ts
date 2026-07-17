import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
type ReminderInsert = Database["public"]["Tables"]["reminders"]["Insert"];

export async function fetchReminders(profileId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("profile_id", profileId)
    .order("remind_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createReminder(reminder: ReminderInsert): Promise<Reminder> {
  const { data, error } = await supabase.from("reminders").insert(reminder).select().single();
  if (error) throw error;
  return data;
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}
