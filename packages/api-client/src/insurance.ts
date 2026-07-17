import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type InsurancePolicy = Database["public"]["Tables"]["insurance_policies"]["Row"];
type InsurancePolicyInsert = Database["public"]["Tables"]["insurance_policies"]["Insert"];
type InsuranceClaim = Database["public"]["Tables"]["insurance_claims"]["Row"];
type InsuranceClaimInsert = Database["public"]["Tables"]["insurance_claims"]["Insert"];

export async function fetchInsurancePolicies(profileId: string): Promise<InsurancePolicy[]> {
  const { data, error } = await supabase
    .from("insurance_policies")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createInsurancePolicy(policy: InsurancePolicyInsert): Promise<InsurancePolicy> {
  const { data, error } = await supabase.from("insurance_policies").insert(policy).select().single();
  if (error) throw error;
  return data;
}

export async function fetchInsuranceClaims(profileId: string): Promise<InsuranceClaim[]> {
  const { data, error } = await supabase
    .from("insurance_claims")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createInsuranceClaim(claim: InsuranceClaimInsert): Promise<InsuranceClaim> {
  const { data, error } = await supabase.from("insurance_claims").insert(claim).select().single();
  if (error) throw error;
  return data;
}
