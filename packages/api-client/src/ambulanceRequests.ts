import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type AmbulanceRequest = Database["public"]["Tables"]["ambulance_requests"]["Row"];
type AmbulanceRequestInsert = Database["public"]["Tables"]["ambulance_requests"]["Insert"];

export async function createAmbulanceRequest(request: AmbulanceRequestInsert): Promise<AmbulanceRequest> {
  const { data, error } = await supabase.from("ambulance_requests").insert(request).select().single();
  if (error) throw error;
  return data;
}

export async function fetchConsumerAmbulanceRequests(consumerId: string): Promise<AmbulanceRequest[]> {
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .eq("consumer_id", consumerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchActiveAmbulanceRequest(consumerId: string): Promise<AmbulanceRequest | null> {
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .eq("consumer_id", consumerId)
    .in("status", ["requested", "accepted", "en_route", "arrived", "transporting"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface AmbulanceRequestDetail {
  request: AmbulanceRequest;
  addressLine: string | null;
  addressLat: number | null;
  addressLng: number | null;
  partnerName: string | null;
}

export async function fetchAmbulanceRequestDetail(id: string): Promise<AmbulanceRequestDetail | null> {
  const { data: request, error } = await supabase.from("ambulance_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!request) return null;

  const [{ data: address }, { data: partner }] = await Promise.all([
    request.pickup_address_id
      ? supabase.from("addresses").select("line1, neighborhood, lat, lng").eq("id", request.pickup_address_id).maybeSingle()
      : Promise.resolve({ data: null }),
    request.ambulance_partner_id
      ? supabase.from("profiles").select("full_name").eq("id", request.ambulance_partner_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    request,
    addressLine: address ? `${address.line1}, ${address.neighborhood ?? ""}`.trim() : null,
    addressLat: address?.lat ?? null,
    addressLng: address?.lng ?? null,
    partnerName: partner?.full_name ?? null,
  };
}

export async function fetchActiveAmbulanceJob(partnerId: string): Promise<AmbulanceRequest | null> {
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .eq("ambulance_partner_id", partnerId)
    .in("status", ["accepted", "en_route", "arrived", "transporting"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAmbulanceRequestHistory(partnerId: string): Promise<AmbulanceRequest[]> {
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .eq("ambulance_partner_id", partnerId)
    .in("status", ["completed", "cancelled"])
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function claimAmbulanceRequest(requestId: string, partnerId: string): Promise<void> {
  const { error } = await supabase
    .from("ambulance_requests")
    .update({ ambulance_partner_id: partnerId, status: "accepted" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function advanceAmbulanceStatus(
  requestId: string,
  status: Database["public"]["Enums"]["ambulance_status"],
): Promise<void> {
  const { error } = await supabase.from("ambulance_requests").update({ status }).eq("id", requestId);
  if (error) throw error;
}

export async function fetchAmbulanceRequestReviews(partnerId: string): Promise<AmbulanceRequest[]> {
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .eq("ambulance_partner_id", partnerId)
    .not("rating", "is", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function rateAmbulanceRequest(requestId: string, rating: number, review: string): Promise<void> {
  const { error } = await supabase.from("ambulance_requests").update({ rating, review }).eq("id", requestId);
  if (error) throw error;
}
