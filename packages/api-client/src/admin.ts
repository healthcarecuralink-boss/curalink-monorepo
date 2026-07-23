import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfessionalProfile = Database["public"]["Tables"]["professional_profiles"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type PayoutRecord = Database["public"]["Tables"]["payout_records"]["Row"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type TeamInvitation = Database["public"]["Tables"]["team_invitations"]["Row"];
type AmbulanceRequest = Database["public"]["Tables"]["ambulance_requests"]["Row"];

export async function createTeam(adminId: string, name: string): Promise<Database["public"]["Tables"]["teams"]["Row"]> {
  const { data, error } = await supabase.from("teams").insert({ admin_id: adminId, name }).select().single();
  if (error) throw error;
  return data;
}

// Ambulance requests currently assigned to the admin's ambulance partners,
// en-route/transporting (README: "Live dispatch map ... ambulance = red").
export async function fetchTeamActiveAmbulanceRequests(partnerIds: string[]): Promise<AmbulanceRequest[]> {
  if (partnerIds.length === 0) return [];
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .in("ambulance_partner_id", partnerIds)
    .in("status", ["accepted", "en_route", "arrived", "transporting"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// Jobs currently assigned within the admin's team, for the "Reassign job" flow.
export async function fetchTeamActiveBookings(teamMemberIds: string[]): Promise<Booking[]> {
  if (teamMemberIds.length === 0) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .in("professional_id", teamMemberIds)
    .in("status", ["pending", "confirmed", "en_route", "in_progress"])
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function reassignJob(bookingId: string, professionalId: string): Promise<void> {
  const { error } = await supabase.from("bookings").update({ professional_id: professionalId }).eq("id", bookingId);
  if (error) throw error;
}

export async function reassignAmbulanceRequest(requestId: string, partnerId: string): Promise<void> {
  const { error } = await supabase.from("ambulance_requests").update({ ambulance_partner_id: partnerId }).eq("id", requestId);
  if (error) throw error;
}

// Unassigned jobs the escalate_stuck_jobs() cron job has flagged as stuck
// past the honest-response threshold -- these aren't scoped to "my team"
// since an unassigned booking isn't tied to any team yet (see the
// escalate_stuck_jobs migration for the "any admin sees unassigned" RLS
// policy this relies on).
export async function fetchEscalatedBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .is("professional_id", null)
    .eq("status", "pending")
    .not("escalated_at", "is", null)
    .order("escalated_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchEscalatedAmbulanceRequests(): Promise<AmbulanceRequest[]> {
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .is("ambulance_partner_id", null)
    .eq("status", "requested")
    .not("escalated_at", "is", null)
    .order("escalated_at", { ascending: true });
  if (error) throw error;
  return data;
}

// Revenue from completed visits across the team's nurse/doctor/vet members.
// ambulance_requests has no price/payment_status column in this schema (only
// bookings and pharmacy_orders are monetized here), so ambulance trips are
// deliberately left out of this total rather than guessed at.
export async function fetchTeamBookingRevenue(professionalIds: string[]): Promise<number> {
  if (professionalIds.length === 0) return 0;
  const { data, error } = await supabase
    .from("bookings")
    .select("price, tip_amount")
    .in("professional_id", professionalIds)
    .eq("status", "completed");
  if (error) throw error;
  return data.reduce((total, row) => total + Number(row.price) + Number(row.tip_amount), 0);
}

export async function fetchTeamPharmacyRevenue(pharmacyIds: string[]): Promise<number> {
  if (pharmacyIds.length === 0) return 0;
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .select("total_price")
    .in("pharmacy_id", pharmacyIds)
    .eq("status", "completed");
  if (error) throw error;
  return data.reduce((total, row) => total + Number(row.total_price ?? 0), 0);
}

// All bookings (any status) across the team's nurse/doctor/vet members, for
// the Analytics/Reports export screens (fetchTeamActiveBookings only covers
// in-flight jobs, which isn't enough for a revenue/history report).
export async function fetchTeamAllBookings(professionalIds: string[]): Promise<Booking[]> {
  if (professionalIds.length === 0) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .in("professional_id", professionalIds)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchTeamPayoutRecords(professionalIds: string[]): Promise<PayoutRecord[]> {
  if (professionalIds.length === 0) return [];
  const { data, error } = await supabase
    .from("payout_records")
    .select("*")
    .in("professional_id", professionalIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// The admin of the given professional's team, if any (used to auto-add the
// admin to a per-booking care-team chat channel). Wraps the team_admin_of()
// security-definer function since RLS doesn't let a non-admin read `teams`.
export async function fetchTeamAdminOf(professionalId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("team_admin_of", { p_professional_id: professionalId });
  if (error) throw error;
  return data;
}

// Search for already CuraLink-verified professionals to invite onto the
// team (see search_verified_professionals -- the role filter matches
// against profiles.roles, which only gains an entry once CuraLink staff has
// approved that role).
export interface VerifiedProfessional {
  id: string;
  full_name: string;
  phone: string | null;
  roles: string[];
}

export async function searchVerifiedProfessionals(query: string, role?: string): Promise<VerifiedProfessional[]> {
  const { data, error } = await supabase.rpc("search_verified_professionals", {
    p_query: query,
    p_role: role ?? null,
  });
  if (error) throw error;
  return data;
}

export async function inviteToTeam(professionalId: string, role: string, teamId: string): Promise<string> {
  const { data, error } = await supabase.rpc("invite_to_team", {
    p_professional_id: professionalId,
    p_role: role,
    p_team_id: teamId,
  });
  if (error) throw error;
  return data;
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_team_invitation", { p_invitation_id: invitationId });
  if (error) throw error;
}

export interface SentInvitation {
  invitation: TeamInvitation;
  profile: Profile | null;
}

// Every invitation this team has sent, regardless of status, for the "Sent
// invitations" list (pending/accepted/rejected/cancelled).
export async function fetchSentInvitations(teamId: string): Promise<SentInvitation[]> {
  const { data: invitations, error } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (invitations.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in(
      "id",
      invitations.map((i) => i.professional_id),
    );
  if (profilesError) throw profilesError;

  return invitations.map((invitation) => ({
    invitation,
    profile: profiles.find((p) => p.id === invitation.professional_id) ?? null,
  }));
}

export interface TeamMemberDetail {
  member: TeamMember;
  profile: Profile | null;
  professionalProfile: ProfessionalProfile | null;
}

export interface RosterEntry {
  member: TeamMember;
  profile: Profile | null;
}

export async function fetchTeamRosterWithProfiles(teamId: string): Promise<RosterEntry[]> {
  const { data: members, error } = await supabase.from("team_members").select("*").eq("team_id", teamId);
  if (error) throw error;
  if (members.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in(
      "id",
      members.map((m) => m.professional_id),
    );
  if (profilesError) throw profilesError;

  return members.map((member) => ({
    member,
    profile: profiles.find((p) => p.id === member.professional_id) ?? null,
  }));
}

export async function fetchTeamMemberDetail(teamMemberId: string): Promise<TeamMemberDetail | null> {
  const { data: member, error } = await supabase.from("team_members").select("*").eq("id", teamMemberId).maybeSingle();
  if (error) throw error;
  if (!member) return null;

  const [{ data: profile }, { data: professionalProfile }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", member.professional_id).maybeSingle(),
    supabase.from("professional_profiles").select("*").eq("profile_id", member.professional_id).maybeSingle(),
  ]);

  return { member, profile: profile ?? null, professionalProfile: professionalProfile ?? null };
}

export async function updateTeamMemberStatus(teamMemberId: string, status: Database["public"]["Tables"]["team_members"]["Row"]["status"]): Promise<void> {
  const { error } = await supabase.from("team_members").update({ status }).eq("id", teamMemberId);
  if (error) throw error;
}

export async function updateTeamMemberDocsOk(teamMemberId: string, docsOk: boolean): Promise<void> {
  const { error } = await supabase.from("team_members").update({ docs_ok: docsOk }).eq("id", teamMemberId);
  if (error) throw error;
}

export async function fetchPharmacyCompletedCounts(pharmacyIds: string[]): Promise<Record<string, number>> {
  if (pharmacyIds.length === 0) return {};
  const { data, error } = await supabase
    .from("pharmacy_orders")
    .select("pharmacy_id")
    .in("pharmacy_id", pharmacyIds)
    .eq("status", "completed");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data as { pharmacy_id: string | null }[]) {
    if (!row.pharmacy_id) continue;
    counts[row.pharmacy_id] = (counts[row.pharmacy_id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchTeamMemberRatings(professionalIds: string[]): Promise<Record<string, number>> {
  if (professionalIds.length === 0) return {};
  const { data, error } = await supabase.from("professional_profiles").select("profile_id, rating").in("profile_id", professionalIds);
  if (error) throw error;
  const ratings: Record<string, number> = {};
  for (const row of data) {
    ratings[row.profile_id] = row.rating;
  }
  return ratings;
}

export async function fetchAmbulanceCompletedCounts(partnerIds: string[]): Promise<Record<string, number>> {
  if (partnerIds.length === 0) return {};
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("ambulance_partner_id")
    .in("ambulance_partner_id", partnerIds)
    .eq("status", "completed");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data as Pick<AmbulanceRequest, "ambulance_partner_id">[]) {
    if (!row.ambulance_partner_id) continue;
    counts[row.ambulance_partner_id] = (counts[row.ambulance_partner_id] ?? 0) + 1;
  }
  return counts;
}
