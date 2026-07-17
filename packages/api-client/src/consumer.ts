import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
type FamilyMemberInsert = Database["public"]["Tables"]["family_members"]["Insert"];
type FamilyMemberUpdate = Database["public"]["Tables"]["family_members"]["Update"];
type EmergencyContact = Database["public"]["Tables"]["emergency_contacts"]["Row"];
type EmergencyContactInsert = Database["public"]["Tables"]["emergency_contacts"]["Insert"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Address = Database["public"]["Tables"]["addresses"]["Row"];
type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];
type LabOrder = Database["public"]["Tables"]["lab_orders"]["Row"];
type LabOrderInsert = Database["public"]["Tables"]["lab_orders"]["Insert"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

export async function fetchFamilyMembers(ownerId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("owner_id", ownerId)
    .order("is_self", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchFamilyMember(id: string): Promise<FamilyMember | null> {
  const { data, error } = await supabase.from("family_members").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createFamilyMember(member: FamilyMemberInsert): Promise<FamilyMember> {
  const { data, error } = await supabase.from("family_members").insert(member).select().single();
  if (error) throw error;
  return data;
}

export async function updateFamilyMember(id: string, patch: FamilyMemberUpdate): Promise<void> {
  const { error } = await supabase.from("family_members").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteFamilyMember(id: string): Promise<void> {
  const { error } = await supabase.from("family_members").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchEmergencyContacts(ownerId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("owner_id", ownerId)
    .order("is_primary", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEmergencyContact(contact: EmergencyContactInsert): Promise<EmergencyContact> {
  const { data, error } = await supabase.from("emergency_contacts").insert(contact).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAddresses(ownerId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAddress(address: AddressInsert): Promise<Address> {
  const { data, error } = await supabase.from("addresses").insert(address).select().single();
  if (error) throw error;
  return data;
}

export async function fetchLabOrders(consumerId: string): Promise<LabOrder[]> {
  const { data, error } = await supabase
    .from("lab_orders")
    .select("*")
    .eq("consumer_id", consumerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createLabOrder(order: LabOrderInsert): Promise<LabOrder> {
  const { data, error } = await supabase.from("lab_orders").insert(order).select().single();
  if (error) throw error;
  return data;
}

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase.from("services").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchServicesByCategory(category: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("category", category)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchServiceById(id: string): Promise<Service | null> {
  const { data, error } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// price/arrival_otp/payment_status are all set server-side by triggers (see
// set_booking_price_from_service + set_booking_arrival_otp) -- the client
// only ever supplies which service/patient/address/time it wants.
export async function createBooking(booking: BookingInsert): Promise<Booking> {
  const { data, error } = await supabase.from("bookings").insert(booking).select().single();
  if (error) throw error;
  return data;
}

// The consumer's single in-flight visit, if any (drives the Home dashboard's
// active-visit card + live-tracking entry point).
export async function fetchActiveBooking(consumerId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("consumer_id", consumerId)
    .in("status", ["confirmed", "en_route", "in_progress"])
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchUpcomingBookings(consumerId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("consumer_id", consumerId)
    .in("status", ["pending", "confirmed", "en_route", "in_progress"])
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchPastBookings(consumerId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("consumer_id", consumerId)
    .in("status", ["completed", "cancelled"])
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface BookingDetail {
  booking: Booking;
  serviceName: string;
  serviceCategory: string | null;
  patientName: string | null;
  providerName: string | null;
  providerPhone: string | null;
  addressLat: number | null;
  addressLng: number | null;
}

export async function fetchBookingDetail(id: string): Promise<BookingDetail | null> {
  const booking = await fetchBookingById(id);
  if (!booking) return null;

  const [{ data: service }, { data: patient }, { data: provider }, { data: address }] = await Promise.all([
    supabase.from("services").select("name, category").eq("id", booking.service_id).maybeSingle(),
    booking.patient_id
      ? supabase.from("family_members").select("full_name").eq("id", booking.patient_id).maybeSingle()
      : Promise.resolve({ data: null }),
    booking.professional_id
      ? supabase.from("profiles").select("full_name, phone").eq("id", booking.professional_id).maybeSingle()
      : Promise.resolve({ data: null }),
    booking.address_id
      ? supabase.from("addresses").select("lat, lng").eq("id", booking.address_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    booking,
    serviceName: service?.name ?? "Visit",
    serviceCategory: service?.category ?? null,
    patientName: patient?.full_name ?? null,
    providerName: provider?.full_name ?? null,
    providerPhone: provider?.phone ?? null,
    addressLat: address?.lat ?? null,
    addressLng: address?.lng ?? null,
  };
}

export async function rateBooking(bookingId: string, rating: number, review: string): Promise<void> {
  const { error } = await supabase.from("bookings").update({ rating, review }).eq("id", bookingId);
  if (error) throw error;
}

export async function payTipFromWallet(bookingId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc("pay_tip_from_wallet", { p_booking_id: bookingId, p_amount: amount });
  if (error) throw error;
}

// Vitals dashboard: every past visit for a family member that recorded
// vitals, newest first (vitals is a free-form jsonb map set during the visit).
// Filtered client-side since PostgREST's jsonb equality filter syntax is
// fragile for "not an empty object" comparisons.
export async function fetchVitalsHistory(patientId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return data.filter((booking) => Object.keys(booking.vitals as object).length > 0);
}

export interface ProviderProfileDetail {
  profile: { id: string; full_name: string };
  professionalProfile: Database["public"]["Tables"]["professional_profiles"]["Row"] | null;
}

export async function fetchProviderProfile(profileId: string): Promise<ProviderProfileDetail | null> {
  const [{ data: profile }, { data: professionalProfile }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("id", profileId).maybeSingle(),
    supabase.from("professional_profiles").select("*").eq("profile_id", profileId).maybeSingle(),
  ]);
  if (!profile) return null;
  return { profile, professionalProfile };
}

export interface MedicalTeamMember {
  profileId: string;
  fullName: string;
  rating: number;
  visitCount: number;
}

// Distinct professionals who've had a booking for this family member, newest
// first by their most recent visit (README: "Medical team" -- derived from
// booking history rather than a separate table).
export async function fetchMedicalTeam(patientId: string): Promise<MedicalTeamMember[]> {
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("professional_id")
    .eq("patient_id", patientId)
    .not("professional_id", "is", null)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;

  const professionalIds = [...new Set(bookings.map((b) => b.professional_id).filter((id): id is string => id !== null))];
  if (professionalIds.length === 0) return [];

  const [{ data: profiles }, { data: professionalProfiles }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", professionalIds),
    supabase.from("professional_profiles").select("profile_id, rating").in("profile_id", professionalIds),
  ]);

  return professionalIds.map((id) => ({
    profileId: id,
    fullName: profiles?.find((p) => p.id === id)?.full_name ?? "Provider",
    rating: professionalProfiles?.find((p) => p.profile_id === id)?.rating ?? 0,
    visitCount: bookings.filter((b) => b.professional_id === id).length,
  }));
}

export async function fetchWalletBalance(profileId: string): Promise<number> {
  const { data, error } = await supabase.from("wallets").select("balance").eq("profile_id", profileId).maybeSingle();
  if (error) throw error;
  return data?.balance ?? 0;
}

export async function fetchWalletTransactions(profileId: string) {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchWalletTransactionById(id: string) {
  const { data, error } = await supabase.from("wallet_transactions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"];
type PharmacyOrderInsert = Database["public"]["Tables"]["pharmacy_orders"]["Insert"];

// prescriptions RLS keys off family_members.owner_id, not a direct
// consumer_id column, so this is two queries rather than one embed.
export async function fetchPrescriptionsForOwner(ownerId: string): Promise<Prescription[]> {
  const familyMembers = await fetchFamilyMembers(ownerId);
  if (familyMembers.length === 0) return [];
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .in(
      "patient_id",
      familyMembers.map((f) => f.id),
    )
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchPrescriptionById(id: string): Promise<Prescription | null> {
  const { data, error } = await supabase.from("prescriptions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface PrescriptionDetail {
  prescription: Prescription;
  patientName: string;
  doctorName: string;
}

export async function fetchPrescriptionDetail(id: string): Promise<PrescriptionDetail | null> {
  const prescription = await fetchPrescriptionById(id);
  if (!prescription) return null;

  const [{ data: patient }, { data: doctor }] = await Promise.all([
    supabase.from("family_members").select("full_name").eq("id", prescription.patient_id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", prescription.doctor_id).maybeSingle(),
  ]);

  return {
    prescription,
    patientName: patient?.full_name ?? "Patient",
    doctorName: doctor?.full_name ?? "Doctor",
  };
}

export async function createPharmacyOrderFromPrescription(order: PharmacyOrderInsert) {
  const { data, error } = await supabase.from("pharmacy_orders").insert(order).select().single();
  if (error) throw error;
  return data;
}

export interface PharmacyPartner {
  profileId: string;
  fullName: string;
  lat: number | null;
  lng: number | null;
  serviceArea: string | null;
  rating: number;
}

// Stopgap "Partner-pharmacy locator" (README) without a Maps SDK -- just the
// pharmacy partners' own lat/lng (already set on professional_profiles),
// distance-sorted client-side. professional_profiles is readable by any
// authenticated user (see rls_policies), so this works for any consumer.
export async function fetchPharmacyPartners(): Promise<PharmacyPartner[]> {
  const { data: profiles, error } = await supabase.from("profiles").select("id, full_name").contains("roles", ["pharmacy"]);
  if (error) throw error;
  if (profiles.length === 0) return [];

  const { data: professionalProfiles, error: ppError } = await supabase
    .from("professional_profiles")
    .select("profile_id, lat, lng, service_area, rating")
    .in(
      "profile_id",
      profiles.map((p) => p.id),
    );
  if (ppError) throw ppError;

  return profiles.map((p) => {
    const pp = professionalProfiles.find((x) => x.profile_id === p.id);
    return {
      profileId: p.id,
      fullName: p.full_name,
      lat: pp?.lat ?? null,
      lng: pp?.lng ?? null,
      serviceArea: pp?.service_area ?? null,
      rating: pp?.rating ?? 0,
    };
  });
}

export interface BookAgainCard {
  booking: Booking;
  providerName: string;
  providerRating: number;
  serviceName: string;
}

// Home dashboard's "Book again" section. Two separate queries + a client
// merge rather than a PostgREST embed, since bookings has two FKs into
// profiles (consumer_id, professional_id) and embedding would be ambiguous
// without hardcoding the generated constraint name.
export async function fetchBookAgain(consumerId: string, limit = 2): Promise<BookAgainCard[]> {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .eq("consumer_id", consumerId)
    .eq("status", "completed")
    .not("professional_id", "is", null)
    .order("scheduled_at", { ascending: false })
    .limit(limit);
  if (bookingsError) throw bookingsError;
  if (bookings.length === 0) return [];

  const providerIds = [...new Set(bookings.map((b) => b.professional_id).filter((id): id is string => id !== null))];
  const serviceIds = [...new Set(bookings.map((b) => b.service_id))];

  const [{ data: profiles, error: profilesError }, { data: professionalProfiles, error: ppError }, { data: services, error: servicesError }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", providerIds),
      supabase.from("professional_profiles").select("profile_id, rating").in("profile_id", providerIds),
      supabase.from("services").select("id, name").in("id", serviceIds),
    ]);
  if (profilesError) throw profilesError;
  if (ppError) throw ppError;
  if (servicesError) throw servicesError;

  return bookings.map((booking) => ({
    booking,
    providerName: profiles.find((p) => p.id === booking.professional_id)?.full_name ?? "Provider",
    providerRating: professionalProfiles.find((p) => p.profile_id === booking.professional_id)?.rating ?? 0,
    serviceName: services.find((s) => s.id === booking.service_id)?.name ?? "Visit",
  }));
}
