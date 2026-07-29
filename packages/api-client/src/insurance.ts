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

// Uploads a policy card photo or claim receipt to the private
// insurance-documents bucket. Path convention matches
// uploadProfessionalDocument: {profile_id}/{docType}-{timestamp}.{ext}, so
// RLS can scope access by the first path segment matching the uploader.
export async function uploadInsuranceDocument(
  profileId: string,
  docType: "policy" | "claim",
  file: { uri: string; name: string; mimeType?: string | null },
): Promise<string> {
  const response = await fetch(file.uri);
  const blob = await response.blob();
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  const ext = extMatch?.[1]?.toLowerCase() ?? "bin";
  const path = `${profileId}/${docType}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("insurance-documents")
    .upload(path, blob, {
      contentType: file.mimeType ?? blob.type ?? "application/octet-stream",
      upsert: false,
    });
  if (error) throw error;
  return path;
}

export async function fetchInsuranceDocumentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("insurance-documents").createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
