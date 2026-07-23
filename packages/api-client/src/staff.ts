import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfessionalCredentials = Database["public"]["Tables"]["professional_credentials"]["Row"];

export interface PendingVerification {
  credentials: ProfessionalCredentials;
  applicant: Profile | null;
}

// CuraLink-staff-only (see is_curalink_staff() and the "curalink staff views
// pending applicants" / "professional_credentials: self or curalink staff"
// RLS policies) -- this is the single, centralized review queue that
// approve_role/reject_role feed. Partners never see this: by the time a
// professional is invitable at all, they're already verified here.
export async function fetchPendingVerifications(): Promise<PendingVerification[]> {
  const { data: allCredentials, error } = await supabase.from("professional_credentials").select("*");
  if (error) throw error;
  const credentialsRows = allCredentials.filter((c) => c.pending_roles.length > 0);
  if (credentialsRows.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in(
      "id",
      credentialsRows.map((c) => c.profile_id),
    );
  if (profilesError) throw profilesError;

  return credentialsRows.map((credentials) => ({
    credentials,
    applicant: profiles.find((p) => p.id === credentials.profile_id) ?? null,
  }));
}

export async function approveVerification(professionalId: string, role: string): Promise<void> {
  const { error } = await supabase.rpc("approve_role", { p_professional_id: professionalId, p_role: role });
  if (error) throw error;
}

export async function rejectVerification(professionalId: string, role: string): Promise<void> {
  const { error } = await supabase.rpc("reject_role", { p_professional_id: professionalId, p_role: role });
  if (error) throw error;
}
