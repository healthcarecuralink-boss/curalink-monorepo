import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type Referral = Database["public"]["Tables"]["referrals"]["Row"];

export async function fetchMyReferralCode(profileId: string): Promise<string | null> {
  const { data, error } = await supabase.from("profiles").select("referral_code").eq("id", profileId).maybeSingle();
  if (error) throw error;
  return data?.referral_code ?? null;
}

export async function fetchMyReferrals(profileId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function redeemReferralCode(code: string): Promise<void> {
  const { error } = await supabase.rpc("redeem_referral_code", { p_code: code.toUpperCase() });
  if (error) throw error;
}
