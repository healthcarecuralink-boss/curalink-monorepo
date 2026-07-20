import { useState, useMemo, useEffect } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchActivePharmacyOrders,
  fetchIncomingPharmacyOrders,
  fetchPharmacyOrderHistory,
  subscribeToIncomingPharmacyOrders,
  useSessionStore,
} from "@curalink/api-client";
import { EmptyState, Skeleton, StatusPill, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";


const tabs = ["available", "accepted", "history"] as const;
type Tab = (typeof tabs)[number];

const statusColors: Record<string, { fg: string; bg: string }> = {
  placed: { fg: "#B45309", bg: "#FEF3E2" },
  preparing: { fg: "#1D4ED8", bg: "#EAF1FE" },
  ready: { fg: "#1D4ED8", bg: "#EAF1FE" },
  picked_up: { fg: "#0B5A45", bg: "#E8F5F0" },
  completed: { fg: "#0B5A45", bg: "#E8F5F0" },
  cancelled: { fg: "#64748B", bg: "#EEF1F4" },
};

export default function OrdersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    tabRow: { flexDirection: "row", gap: 8 },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabText: { fontSize: 12.5, fontWeight: "700", color: colors.muted, textTransform: "capitalize" },
    tabTextActive: { color: "#FFFFFF" },
    orderCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    orderPrice: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    orderMeta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
        }),
      [colors],
    );
  const [tab, setTab] = useState<Tab>("available");
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const accent = roleAccents.pharmacy;
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = subscribeToIncomingPharmacyOrders(() => {
      queryClient.invalidateQueries({ queryKey: ["incomingPharmacyOrders"] });
    });
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const { data: available } = useQuery({
    queryKey: ["incomingPharmacyOrders"],
    queryFn: () => fetchIncomingPharmacyOrders(),
    enabled: tab === "available",
  });
  const { data: active } = useQuery({
    queryKey: ["activePharmacyOrders", userId],
    queryFn: () => fetchActivePharmacyOrders(userId as string),
    enabled: Boolean(userId) && tab === "accepted",
  });
  const { data: history } = useQuery({
    queryKey: ["pharmacyOrderHistory", userId],
    queryFn: () => fetchPharmacyOrderHistory(userId as string),
    enabled: Boolean(userId) && tab === "history",
  });

  const listForTab = tab === "available" ? available : tab === "accepted" ? active : history;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Orders</Text>

      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {listForTab === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : listForTab.length === 0 ? (
        <EmptyState icon={<Package size={26} color={accent} strokeWidth={1.6} />} title={`No ${tab} orders`} />
      ) : (
        <View style={{ gap: 10 }}>
          {listForTab.map((order) => (
            <Pressable key={order.id} style={styles.orderCard} onPress={() => router.push(`/orders/${order.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderPrice}>₹{order.total_price ?? "—"}</Text>
                <Text style={styles.orderMeta}>
                  {Array.isArray(order.items) ? order.items.length : 0} items ·{" "}
                  {new Date(order.created_at).toLocaleString("en-IN")}
                </Text>
              </View>
              <StatusPill
                label={order.status.replace("_", " ")}
                {...(statusColors[order.status] ?? { fg: colors.muted, bg: colors.border })}
              />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
