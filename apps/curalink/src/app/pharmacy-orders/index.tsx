import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pill } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchConsumerPharmacyOrders, useSessionStore } from "@curalink/api-client";
import { EmptyState, Skeleton, StatusPill, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";


const statusPillFor = (status: string) => {
  switch (status) {
    case "placed":
      return curalinkStatusPillColors.pending;
    case "preparing":
    case "ready":
      return curalinkStatusPillColors.confirmed;
    case "picked_up":
      return curalinkStatusPillColors.enRoute;
    case "completed":
      return curalinkStatusPillColors.completed;
    default:
      return curalinkStatusPillColors.cancelled;
  }
};

export default function PharmacyOrdersScreen() {
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
    orderCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 16,
      padding: 14,
    },
    orderPrice: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    orderMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const consumerId = session?.user.id;

  const { data: orders } = useQuery({
    queryKey: ["consumerPharmacyOrders", consumerId],
    queryFn: () => fetchConsumerPharmacyOrders(consumerId as string),
    enabled: Boolean(consumerId),
  });

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
        <Text style={styles.title}>Pharmacy orders</Text>
      </View>

      {orders === undefined ? (
        <Skeleton height={80} borderRadius={18} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Pill size={26} color={colors.primary} strokeWidth={1.6} />} title="No pharmacy orders yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {orders.map((order) => (
            <Pressable key={order.id} style={styles.orderCard} onPress={() => router.push(`/pharmacy-orders/${order.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderPrice}>₹{order.total_price ?? "—"}</Text>
                <Text style={styles.orderMeta}>
                  {Array.isArray(order.items) ? order.items.length : 0} items ·{" "}
                  {new Date(order.created_at).toLocaleDateString("en-IN")}
                </Text>
              </View>
              <StatusPill label={order.status.replace("_", " ")} {...statusPillFor(order.status)} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
