import { supabase } from "./supabaseClient";
import type { Database, Json, PharmacyOrderStatus } from "./database.types";

type PharmacyOrder = Database["public"]["Tables"]["pharmacy_orders"]["Row"];

export async function fetchConsumerPharmacyOrders(consumerId: string): Promise<PharmacyOrder[]> {
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .select("*")
    .eq("consumer_id", consumerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export interface PharmacyOrderDetail {
  order: PharmacyOrder;
  patientName: string | null;
  pharmacyName: string | null;
}

export async function fetchPharmacyOrderDetail(id: string): Promise<PharmacyOrderDetail | null> {
  const { data: order, error } = await supabase.from("pharmacy_orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const [{ data: patient }, { data: pharmacy }] = await Promise.all([
    order.patient_id
      ? supabase.from("family_members").select("full_name").eq("id", order.patient_id).maybeSingle()
      : Promise.resolve({ data: null }),
    order.pharmacy_id
      ? supabase.from("profiles").select("full_name").eq("id", order.pharmacy_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    order,
    patientName: patient?.full_name ?? null,
    pharmacyName: pharmacy?.full_name ?? null,
  };
}

// This pharmacy's orders currently being fulfilled (README's Orders "Active" tab).
export async function fetchActivePharmacyOrders(pharmacyId: string): Promise<PharmacyOrder[]> {
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .select("*")
    .eq("pharmacy_id", pharmacyId)
    .in("status", ["preparing", "ready", "picked_up"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export interface PharmacyOrderLocation {
  orderId: string;
  status: PharmacyOrderStatus;
  lat: number;
  lng: number;
  addressLabel: string | null;
}

// README: Pharmacy Partner "Pickup map" -- delivery addresses for this
// pharmacy's active orders, so a rider can see where they're headed. Orders
// have no live GPS stream (unlike bookings/ambulance requests -- there's no
// rider-location concept in this schema, just a destination pin).
export async function fetchActivePharmacyOrderLocations(pharmacyId: string): Promise<PharmacyOrderLocation[]> {
  const { data: orders, error } = await supabase
    .from("pharmacy_orders")
    .select("id, status, delivery_address_id")
    .eq("pharmacy_id", pharmacyId)
    .in("status", ["preparing", "ready", "picked_up"])
    .not("delivery_address_id", "is", null);
  if (error) throw error;
  if (!orders || orders.length === 0) return [];

  const addressIds = [...new Set(orders.map((o) => o.delivery_address_id).filter((id): id is string => id !== null))];
  const { data: addresses, error: addressError } = await supabase
    .from("addresses")
    .select("id, lat, lng, line1, neighborhood")
    .in("id", addressIds);
  if (addressError) throw addressError;

  const addressById = new Map((addresses ?? []).map((a) => [a.id, a]));
  return orders
    .map((order): PharmacyOrderLocation | null => {
      const address = order.delivery_address_id ? addressById.get(order.delivery_address_id) : undefined;
      if (!address || address.lat === null || address.lng === null) return null;
      return {
        orderId: order.id,
        status: order.status,
        lat: address.lat,
        lng: address.lng,
        addressLabel: `${address.line1}${address.neighborhood ? `, ${address.neighborhood}` : ""}`,
      };
    })
    .filter((loc): loc is PharmacyOrderLocation => loc !== null);
}

export async function fetchPharmacyOrderHistory(pharmacyId: string): Promise<PharmacyOrder[]> {
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .select("*")
    .eq("pharmacy_id", pharmacyId)
    .in("status", ["completed", "cancelled"])
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Claiming an unassigned order starts fulfillment in the same motion (README's
// stepper begins at "Preparing"), matching acceptJob's claim-and-advance pattern.
export async function claimPharmacyOrder(orderId: string, pharmacyId: string): Promise<void> {
  const { error } = await supabase
    .from("pharmacy_orders")
    .update({ pharmacy_id: pharmacyId, status: "preparing" })
    .eq("id", orderId);
  if (error) throw error;
}

export async function updatePharmacyOrderItems(orderId: string, items: Json): Promise<void> {
  const { error } = await supabase.from("pharmacy_orders").update({ items }).eq("id", orderId);
  if (error) throw error;
}

export async function advancePharmacyOrderStatus(
  orderId: string,
  status: Database["public"]["Enums"]["pharmacy_order_status"],
): Promise<void> {
  const { error } = await supabase.from("pharmacy_orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

export async function fetchPharmacyOrderReviews(pharmacyId: string): Promise<PharmacyOrder[]> {
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .select("*")
    .eq("pharmacy_id", pharmacyId)
    .not("rating", "is", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function ratePharmacyOrder(orderId: string, rating: number, review: string): Promise<void> {
  const { error } = await supabase.from("pharmacy_orders").update({ rating, review }).eq("id", orderId);
  if (error) throw error;
}
