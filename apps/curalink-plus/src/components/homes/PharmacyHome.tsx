import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Package, Percent, ShoppingBag } from "lucide-react-native";
import { StyleSheet, Switch, Text, View } from "react-native";
import {
  fetchIncomingPharmacyOrders,
  fetchProfessionalProfile,
  setOnDuty,
  subscribeToIncomingPharmacyOrders,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";

const accent = roleAccents.pharmacy;

export function PharmacyHome() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { gap: 14 },
    statusCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14.5, color: colors.ink },
    statusSubtitle: { fontSize: 12, color: colors.muted, marginTop: 3 },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
    statValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 17, color: colors.ink },
    statLabel: { fontSize: 10.5, color: colors.muted, textAlign: "center" },
    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
    seeAll: { fontSize: 12, fontWeight: "700" },
    orderCard: { gap: 4 },
    orderTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    orderMeta: { fontSize: 11.5, color: colors.muted },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const { data: professionalProfile } = useQuery({
    queryKey: ["professionalProfile", userId],
    queryFn: () => fetchProfessionalProfile(userId as string),
    enabled: Boolean(userId),
  });
  const { data: orders } = useQuery({
    queryKey: ["incomingPharmacyOrders"],
    queryFn: () => fetchIncomingPharmacyOrders(),
    enabled: Boolean(professionalProfile?.is_on_duty),
  });

  useEffect(() => {
    const channel = subscribeToIncomingPharmacyOrders(() => {
      queryClient.invalidateQueries({ queryKey: ["incomingPharmacyOrders"] });
    });
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const isAccepting = professionalProfile?.is_on_duty ?? false;

  async function toggleAccepting() {
    if (!userId) return;
    await setOnDuty(userId, !isAccepting);
    void queryClient.invalidateQueries({ queryKey: ["professionalProfile", userId] });
  }

  return (
    <View style={styles.container}>
      <Card style={[styles.statusCard, { borderColor: isAccepting ? accent : colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isAccepting ? accent : colors.muted }]} />
            <Text style={styles.statusLabel}>{isAccepting ? "Accepting orders" : "Paused"}</Text>
          </View>
          <Text style={styles.statusSubtitle}>
            {isAccepting ? "New orders will reach you" : "You won't receive new orders"}
          </Text>
        </View>
        <Switch value={isAccepting} onValueChange={() => void toggleAccepting()} trackColor={{ true: accent, false: colors.border }} />
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{orders?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Orders today</Text>
        </Card>
        <Card style={styles.statCard}>
          <ShoppingBag size={16} color={colors.ink} />
          <Text style={styles.statLabel}>Revenue today</Text>
        </Card>
        <Card style={styles.statCard}>
          <Percent size={16} color={colors.ink} />
          <Text style={styles.statLabel}>Fulfillment rate</Text>
        </Card>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Incoming orders</Text>
        <Text style={[styles.seeAll, { color: accent }]} onPress={() => router.push("/(tabs)/orders")}>
          See all
        </Text>
      </View>
      {orders === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package size={26} color={accent} strokeWidth={1.6} />}
          title="No incoming orders"
          body="New pharmacy orders will show up here."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {orders.slice(0, 3).map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <Text style={styles.orderTitle}>₹{order.total_price ?? "—"}</Text>
              <Text style={styles.orderMeta}>{Array.isArray(order.items) ? order.items.length : 0} items</Text>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}
