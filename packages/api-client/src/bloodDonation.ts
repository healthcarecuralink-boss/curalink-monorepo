import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type BloodDonor = Database["public"]["Tables"]["blood_donors"]["Row"];
type BloodDonorInsert = Database["public"]["Tables"]["blood_donors"]["Insert"];
type BloodRequest = Database["public"]["Tables"]["blood_requests"]["Row"];
type BloodRequestInsert = Database["public"]["Tables"]["blood_requests"]["Insert"];
type BloodRequestResponse = Database["public"]["Tables"]["blood_request_responses"]["Row"];

export async function fetchMyDonorProfile(profileId: string): Promise<BloodDonor | null> {
  const { data, error } = await supabase.from("blood_donors").select("*").eq("profile_id", profileId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertDonorProfile(donor: BloodDonorInsert): Promise<BloodDonor> {
  const { data, error } = await supabase.from("blood_donors").upsert(donor).select().single();
  if (error) throw error;
  return data;
}

export async function fetchOpenBloodRequests(): Promise<BloodRequest[]> {
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchMyBloodRequests(requesterId: string): Promise<BloodRequest[]> {
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("requester_id", requesterId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBloodRequest(request: BloodRequestInsert): Promise<BloodRequest> {
  const { data, error } = await supabase.from("blood_requests").insert(request).select().single();
  if (error) throw error;
  return data;
}

export async function updateBloodRequestStatus(
  id: string,
  status: Database["public"]["Tables"]["blood_requests"]["Row"]["status"],
): Promise<void> {
  const { error } = await supabase.from("blood_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function fetchResponsesForRequest(requestId: string): Promise<BloodRequestResponse[]> {
  const { data, error } = await supabase
    .from("blood_request_responses")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function respondToBloodRequest(requestId: string, donorId: string): Promise<void> {
  const { error } = await supabase.from("blood_request_responses").insert({ request_id: requestId, donor_id: donorId });
  if (error) throw error;
}

export async function fetchMyResponses(donorId: string): Promise<BloodRequestResponse[]> {
  const { data, error } = await supabase
    .from("blood_request_responses")
    .select("*")
    .eq("donor_id", donorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
