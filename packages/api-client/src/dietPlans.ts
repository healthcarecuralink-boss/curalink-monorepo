import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type DietPlan = Database["public"]["Tables"]["diet_plans"]["Row"];
type DietPlanInsert = Database["public"]["Tables"]["diet_plans"]["Insert"];

export async function fetchDietPlansForPatient(patientId: string): Promise<DietPlan[]> {
  const { data, error } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// All diet plans across every family member the signed-in consumer owns
// (mirrors fetchPrescriptionsForOwner's two-step shape, since diet_plans
// keys off patient_id, not a direct consumer_id column).
export async function fetchDietPlansForOwner(ownerId: string): Promise<DietPlan[]> {
  const { data: familyMembers, error: familyError } = await supabase
    .from("family_members")
    .select("id")
    .eq("owner_id", ownerId);
  if (familyError) throw familyError;
  if (familyMembers.length === 0) return [];

  const { data, error } = await supabase
    .from("diet_plans")
    .select("*")
    .in(
      "patient_id",
      familyMembers.map((f) => f.id),
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchDietPlansCreatedBy(professionalId: string): Promise<DietPlan[]> {
  const { data, error } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("created_by", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDietPlan(plan: DietPlanInsert): Promise<DietPlan> {
  const { data, error } = await supabase.from("diet_plans").insert(plan).select().single();
  if (error) throw error;
  return data;
}
