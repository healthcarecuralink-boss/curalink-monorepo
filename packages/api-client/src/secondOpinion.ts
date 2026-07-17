import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type SecondOpinionRequest = Database["public"]["Tables"]["second_opinion_requests"]["Row"];
type SecondOpinionRequestInsert = Database["public"]["Tables"]["second_opinion_requests"]["Insert"];

export async function fetchMySecondOpinionRequests(consumerId: string): Promise<SecondOpinionRequest[]> {
  const { data, error } = await supabase
    .from("second_opinion_requests")
    .select("*")
    .eq("consumer_id", consumerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSecondOpinionRequest(request: SecondOpinionRequestInsert): Promise<SecondOpinionRequest> {
  const { data, error } = await supabase.from("second_opinion_requests").insert(request).select().single();
  if (error) throw error;
  return data;
}

export async function fetchOpenSecondOpinionRequests(): Promise<SecondOpinionRequest[]> {
  const { data, error } = await supabase
    .from("second_opinion_requests")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchMyClaimedSecondOpinionRequests(doctorId: string): Promise<SecondOpinionRequest[]> {
  const { data, error } = await supabase
    .from("second_opinion_requests")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function claimSecondOpinionRequest(id: string, doctorId: string): Promise<void> {
  const { error } = await supabase.from("second_opinion_requests").update({ doctor_id: doctorId, status: "claimed" }).eq("id", id);
  if (error) throw error;
}

export async function answerSecondOpinionRequest(id: string, response: string): Promise<void> {
  const { error } = await supabase.from("second_opinion_requests").update({ response, status: "answered" }).eq("id", id);
  if (error) throw error;
}
