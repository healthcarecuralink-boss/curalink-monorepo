import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type LoyaltyAccount = Database["public"]["Tables"]["loyalty_accounts"]["Row"];
type LoyaltyTransaction = Database["public"]["Tables"]["loyalty_transactions"]["Row"];
type RewardCatalogItem = Database["public"]["Tables"]["reward_catalog"]["Row"];
type RewardRedemption = Database["public"]["Tables"]["reward_redemptions"]["Row"];

export async function fetchLoyaltyAccount(profileId: string): Promise<LoyaltyAccount | null> {
  const { data, error } = await supabase.from("loyalty_accounts").select("*").eq("profile_id", profileId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchLoyaltyTransactions(profileId: string): Promise<LoyaltyTransaction[]> {
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRewardCatalog(): Promise<RewardCatalogItem[]> {
  const { data, error } = await supabase
    .from("reward_catalog")
    .select("*")
    .eq("is_active", true)
    .order("points_cost", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchRewardRedemptions(profileId: string): Promise<RewardRedemption[]> {
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function redeemReward(rewardId: string): Promise<string> {
  const { data, error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId });
  if (error) throw error;
  return data;
}
