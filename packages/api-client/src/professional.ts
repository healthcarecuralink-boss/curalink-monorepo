import { supabase } from "./supabaseClient";
import type { Database, Json } from "./database.types";

type ProfessionalProfile = Database["public"]["Tables"]["professional_profiles"]["Row"];
type ProfessionalProfileUpdate = Database["public"]["Tables"]["professional_profiles"]["Update"];
type ProfessionalCredentials = Database["public"]["Tables"]["professional_credentials"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"];
type PrescriptionInsert = Database["public"]["Tables"]["prescriptions"]["Insert"];
type TimeOff = Database["public"]["Tables"]["professional_time_off"]["Row"];
type TimeOffInsert = Database["public"]["Tables"]["professional_time_off"]["Insert"];
type TeamInvitation = Database["public"]["Tables"]["team_invitations"]["Row"];

export async function fetchProfessionalProfile(profileId: string): Promise<ProfessionalProfile | null> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfessionalProfile(
  profileId: string,
  patch: ProfessionalProfileUpdate,
): Promise<void> {
  const { error } = await supabase.from("professional_profiles").update(patch).eq("profile_id", profileId);
  if (error) throw error;
}

export async function fetchProfessionalCredentials(profileId: string): Promise<ProfessionalCredentials | null> {
  const { data, error } = await supabase
    .from("professional_credentials")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// credentials/docs/bank_details only -- verification_status and pending_roles
// are not client-writable (see rls_policies migration); pending_roles is
// only ever changed via requestRole()/approve_role.
export async function updateProfessionalCredentials(
  profileId: string,
  patch: { credentials?: Json; docs?: Json; bank_details?: Json },
): Promise<void> {
  const { error } = await supabase.from("professional_credentials").update(patch).eq("profile_id", profileId);
  if (error) throw error;
}

export async function setOnDuty(profileId: string, isOnDuty: boolean): Promise<void> {
  const { error } = await supabase
    .from("professional_profiles")
    .update({ is_on_duty: isOnDuty })
    .eq("profile_id", profileId);
  if (error) throw error;
}

// The professional's current in-progress/assigned job, if any.
export async function fetchActiveJob(professionalId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("professional_id", professionalId)
    .in("status", ["confirmed", "en_route", "in_progress"])
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Pending, unassigned jobs a nurse/vet/doctor could accept (README:
// "nearest available provider" -- proximity matching lands in Step 6/7;
// for now this lists all open jobs in the professional's service category).
export async function fetchAvailableJobs(category: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, services!inner(category)")
    .is("professional_id", null)
    .eq("status", "pending")
    .eq("services.category", category)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data as unknown as Booking[];
}

export async function fetchTeamRoster(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase.from("team_members").select("*").eq("team_id", teamId);
  if (error) throw error;
  return data;
}

export async function fetchMyTeam(adminId: string): Promise<Database["public"]["Tables"]["teams"]["Row"] | null> {
  const { data, error } = await supabase.from("teams").select("*").eq("admin_id", adminId).maybeSingle();
  if (error) throw error;
  return data;
}

type PharmacyOrder = Database["public"]["Tables"]["pharmacy_orders"]["Row"];
type AmbulanceRequest = Database["public"]["Tables"]["ambulance_requests"]["Row"];

export async function fetchIncomingPharmacyOrders(): Promise<PharmacyOrder[]> {
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .select("*")
    .is("pharmacy_id", null)
    .eq("status", "placed")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchIncomingAmbulanceRequests(): Promise<AmbulanceRequest[]> {
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .is("ambulance_partner_id", null)
    .eq("status", "requested")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// Realtime for the three "open pool" tables (unassigned bookings/orders/
// requests any eligible professional can claim). postgres_changes only
// supports a single-column filter, and "unassigned and pending" is a
// two-column condition, so these subscribe unfiltered and let the caller
// refetch (RLS still confines what an individual row event actually reveals
// -- see unassigned_job_visibility migration). Caller unsubscribes on unmount
// (same pattern as subscribeToProviderLocation).
export function subscribeToAvailableJobs(onChange: () => void) {
  return supabase
    .channel("bookings:open-pool")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, onChange)
    .subscribe();
}

export function subscribeToIncomingPharmacyOrders(onChange: () => void) {
  return supabase
    .channel("pharmacy_orders:open-pool")
    .on("postgres_changes", { event: "*", schema: "public", table: "pharmacy_orders" }, onChange)
    .subscribe();
}

export function subscribeToIncomingAmbulanceRequests(onChange: () => void) {
  return supabase
    .channel("ambulance_requests:open-pool")
    .on("postgres_changes", { event: "*", schema: "public", table: "ambulance_requests" }, onChange)
    .subscribe();
}

export async function fetchBookingReviews(professionalId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("professional_id", professionalId)
    .not("rating", "is", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchJobHistory(professionalId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("professional_id", professionalId)
    .in("status", ["completed", "cancelled"])
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return data;
}

export interface JobDetail {
  booking: Booking;
  serviceName: string;
  patientName: string | null;
  addressLine: string | null;
  addressLat: number | null;
  addressLng: number | null;
  consumerPhone: string | null;
}

export async function fetchJobDetail(id: string): Promise<JobDetail | null> {
  const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!booking) return null;

  const [{ data: service }, { data: patient }, { data: address }, { data: consumer }] = await Promise.all([
    supabase.from("services").select("name").eq("id", booking.service_id).maybeSingle(),
    booking.patient_id
      ? supabase.from("family_members").select("full_name").eq("id", booking.patient_id).maybeSingle()
      : Promise.resolve({ data: null }),
    booking.address_id
      ? supabase.from("addresses").select("line1, neighborhood, lat, lng").eq("id", booking.address_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("phone").eq("id", booking.consumer_id).maybeSingle(),
  ]);

  return {
    booking,
    serviceName: service?.name ?? "Visit",
    patientName: patient?.full_name ?? null,
    addressLine: address ? `${address.line1}, ${address.neighborhood ?? ""}`.trim() : null,
    addressLat: address?.lat ?? null,
    addressLng: address?.lng ?? null,
    consumerPhone: consumer?.phone ?? null,
  };
}

// Claims an unassigned, pending job (RLS: "bookings: professional accepts an
// unassigned job" only allows this exact transition).
export async function acceptJob(bookingId: string, professionalId: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ professional_id: professionalId, status: "confirmed" })
    .eq("id", bookingId);
  if (error) throw error;
}

export async function updateBookingStatus(
  bookingId: string,
  status: Database["public"]["Enums"]["booking_status"],
): Promise<void> {
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
  if (error) throw error;
}

export interface VisitFieldsPatch {
  vitals?: Json;
  notes?: string;
  meds_given?: Json;
  lab_reports?: Json;
}

export async function updateVisitFields(bookingId: string, patch: VisitFieldsPatch): Promise<void> {
  const { error } = await supabase.from("bookings").update(patch).eq("id", bookingId);
  if (error) throw error;
}

export async function completeVisit(bookingId: string, handoffNote: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "completed", handoff_note: handoffNote })
    .eq("id", bookingId);
  if (error) throw error;
}

// Earnings: sum of completed bookings' price + tip for this professional
// since a given date (client computes today/week/month cutoffs).
export async function fetchCompletedBookingsSince(professionalId: string, since: Date): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("status", "completed")
    .gte("scheduled_at", since.toISOString());
  if (error) throw error;
  return data;
}

type PayoutMethod = Database["public"]["Tables"]["payout_methods"]["Row"];
type PayoutMethodInsert = Database["public"]["Tables"]["payout_methods"]["Insert"];
type PayoutRecord = Database["public"]["Tables"]["payout_records"]["Row"];

export async function fetchPayoutMethods(professionalId: string): Promise<PayoutMethod[]> {
  const { data, error } = await supabase
    .from("payout_methods")
    .select("*")
    .eq("professional_id", professionalId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPayoutMethod(method: PayoutMethodInsert): Promise<PayoutMethod> {
  const { data, error } = await supabase.from("payout_methods").insert(method).select().single();
  if (error) throw error;
  return data;
}

export async function fetchPayoutRecords(professionalId: string): Promise<PayoutRecord[]> {
  const { data, error } = await supabase
    .from("payout_records")
    .select("*")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPrescription(prescription: PrescriptionInsert): Promise<Prescription> {
  const { data, error } = await supabase.from("prescriptions").insert(prescription).select().single();
  if (error) throw error;
  return data;
}

export async function fetchPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchMyTimeOff(professionalId: string): Promise<TimeOff[]> {
  const { data, error } = await supabase
    .from("professional_time_off")
    .select("*")
    .eq("professional_id", professionalId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function requestTimeOff(request: TimeOffInsert): Promise<TimeOff> {
  const { data, error } = await supabase.from("professional_time_off").insert(request).select().single();
  if (error) throw error;
  return data;
}

export async function cancelTimeOff(id: string): Promise<void> {
  const { error } = await supabase.from("professional_time_off").delete().eq("id", id);
  if (error) throw error;
}

// Every time-off request across the admin's team, for the review queue.
export async function fetchTeamTimeOff(professionalIds: string[]): Promise<TimeOff[]> {
  if (professionalIds.length === 0) return [];
  const { data, error } = await supabase
    .from("professional_time_off")
    .select("*")
    .in("professional_id", professionalIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function reviewTimeOff(id: string, status: "approved" | "rejected"): Promise<void> {
  const { error } = await supabase.rpc("admin_review_time_off", { p_time_off_id: id, p_status: status });
  if (error) throw error;
}

export interface IncomingInvitation {
  invitation: TeamInvitation;
  teamName: string | null;
}

// Incoming, still-open team invitations for a professional (partner-initiated
// -- see invite_to_team/respond_to_team_invitation in admin.ts).
export async function fetchMyTeamInvitations(professionalId: string): Promise<IncomingInvitation[]> {
  const { data: invitations, error } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (invitations.length === 0) return [];

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .in(
      "id",
      invitations.map((i) => i.team_id),
    );
  if (teamsError) throw teamsError;

  return invitations.map((invitation) => ({
    invitation,
    teamName: teams.find((t) => t.id === invitation.team_id)?.name ?? null,
  }));
}

export async function respondToTeamInvitation(invitationId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc("respond_to_team_invitation", {
    p_invitation_id: invitationId,
    p_accept: accept,
  });
  if (error) throw error;
}
