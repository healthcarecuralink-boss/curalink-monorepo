import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Award, Gift } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchLoyaltyAccount,
  fetchLoyaltyTransactions,
  fetchRewardCatalog,
  redeemReward,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";

export default function LoyaltyRewardsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
        header: { flexDirection: "row", alignItems: "center", gap: 12 },
        backButton: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: colors.ink },
        balanceCard: { alignItems: "center", gap: 4, paddingVertical: 22, backgroundColor: colors.primary },
        balanceValue: { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
        balanceLabel: { fontSize: 12, color: "rgba(255,255,255,0.85)" },
        rewardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        rewardName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        rewardDescription: { fontSize: 11.5, marginTop: 2, color: colors.muted },
        rewardCost: { fontSize: 12, fontWeight: "700", marginTop: 4, color: colors.primary },
        historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
        historyReason: { fontSize: 12.5, flex: 1, color: colors.ink },
        historyPointsEarn: { fontSize: 12.5, fontWeight: "700", color: colors.primary },
        historyPointsRedeem: { fontSize: 12.5, fontWeight: "700", color: colors.error },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { data: account } = useQuery({
    queryKey: ["loyaltyAccount", profileId],
    queryFn: () => fetchLoyaltyAccount(profileId as string),
    enabled: Boolean(profileId),
  });
  const { data: catalog } = useQuery({
    queryKey: ["rewardCatalog"],
    queryFn: () => fetchRewardCatalog(),
  });
  const { data: history } = useQuery({
    queryKey: ["loyaltyTransactions", profileId],
    queryFn: () => fetchLoyaltyTransactions(profileId as string),
    enabled: Boolean(profileId),
  });

  const balance = account?.balance ?? 0;

  async function handleRedeem(rewardId: string) {
    setRedeemingId(rewardId);
    try {
      await redeemReward(rewardId);
      void queryClient.invalidateQueries({ queryKey: ["loyaltyAccount", profileId] });
      void queryClient.invalidateQueries({ queryKey: ["loyaltyTransactions", profileId] });
    } finally {
      setRedeemingId(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Loyalty rewards</Text>
      </View>

      <Card style={styles.balanceCard}>
        <Award size={24} color="#FFFFFF" strokeWidth={1.8} />
        <Text style={styles.balanceValue}>{balance}</Text>
        <Text style={styles.balanceLabel}>points available</Text>
      </Card>

      <Text style={styles.sectionTitle}>Redeem</Text>
      {catalog === undefined ? (
        <Skeleton height={80} borderRadius={18} />
      ) : (
        <View style={{ gap: 10 }}>
          {catalog.map((reward) => (
            <Card key={reward.id} style={styles.rewardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardName}>{reward.name}</Text>
                {reward.description ? <Text style={styles.rewardDescription}>{reward.description}</Text> : null}
                <Text style={styles.rewardCost}>{reward.points_cost} pts</Text>
              </View>
              <Button
                label={redeemingId === reward.id ? "..." : "Redeem"}
                variant="secondary"
                disabled={balance < reward.points_cost || redeemingId !== null}
                onPress={() => void handleRedeem(reward.id)}
              />
            </Card>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>History</Text>
      {history === undefined ? (
        <Skeleton height={70} borderRadius={18} />
      ) : history.length === 0 ? (
        <EmptyState icon={<Gift size={26} color={colors.primary} strokeWidth={1.6} />} title="No activity yet" />
      ) : (
        <View style={{ gap: 6 }}>
          {history.map((txn) => (
            <View key={txn.id} style={styles.historyRow}>
              <Text style={styles.historyReason}>{txn.reason}</Text>
              <Text style={txn.type === "earn" ? styles.historyPointsEarn : styles.historyPointsRedeem}>
                {txn.type === "earn" ? "+" : "-"}
                {txn.points}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
