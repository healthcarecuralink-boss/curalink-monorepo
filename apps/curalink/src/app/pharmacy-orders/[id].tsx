import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Pill } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchPharmacyOrderDetail, ratePharmacyOrder } from "@curalink/api-client";
import { Card, Skeleton, StatusPill, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";
import { RatingForm } from "../../components/RatingForm";


interface OrderItem {
  name: string;
  qty: number;
  in_stock: boolean;
  substitute?: string;
}

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

const statusSteps = ["placed", "preparing", "ready", "picked_up", "completed"];

export default function PharmacyOrderDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 14 },
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
    title: { fontFamily: curalinkFonts.heading, fontSize: 18, color: colors.ink },
    subtitle: { fontSize: 12, color: colors.muted2, marginTop: 1 },
    timeline: { gap: 10 },
    timelineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.border2 },
    timelineLabel: { fontSize: 12.5, color: colors.muted2, textTransform: "capitalize" },
    pickupCard: { flexDirection: "row", alignItems: "center", gap: 12, borderColor: colors.primary, borderWidth: 1.5 },
    pickupLabel: { fontSize: 11.5, color: colors.muted2 },
    pickupCode: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink, letterSpacing: 2 },
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: colors.ink, marginBottom: 8 },
    itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.divider },
    itemName: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
    itemNote: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
    bodyText: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
        }),
      [colors],
    );
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: detail } = useQuery({
    queryKey: ["consumerPharmacyOrderDetail", id],
    queryFn: () => fetchPharmacyOrderDetail(id),
    enabled: Boolean(id),
  });

  async function handleRate(rating: number, review: string) {
    await ratePharmacyOrder(id, rating, review);
    void queryClient.invalidateQueries({ queryKey: ["consumerPharmacyOrderDetail", id] });
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={18} />
      </View>
    );
  }

  const { order, pharmacyName } = detail;
  const items = Array.isArray(order.items) ? (order.items as unknown as OrderItem[]) : [];
  const currentStepIndex = statusSteps.indexOf(order.status);

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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>₹{order.total_price ?? "—"}</Text>
          {pharmacyName ? <Text style={styles.subtitle}>{pharmacyName}</Text> : null}
        </View>
        <StatusPill label={order.status.replace("_", " ")} {...statusPillFor(order.status)} />
      </View>

      {order.status !== "cancelled" ? (
        <Card style={styles.timeline}>
          {statusSteps.map((step, i) => (
            <View key={step} style={styles.timelineRow}>
              <View style={[styles.timelineDot, i <= currentStepIndex && { backgroundColor: colors.primary }]} />
              <Text style={[styles.timelineLabel, i <= currentStepIndex && { color: colors.ink, fontWeight: "700" }]}>
                {step.replace("_", " ")}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {order.pickup_code && (order.status === "ready" || order.status === "picked_up") ? (
        <Card style={styles.pickupCard}>
          <MapPin size={18} color={colors.primary} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pickupLabel}>Pickup / delivery code</Text>
            <Text style={styles.pickupCode}>{order.pickup_code}</Text>
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((item, i) => (
          <View key={`${item.name}-${i}`} style={styles.itemRow}>
            <Pill size={15} color={colors.primary} strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>
                {item.name} × {item.qty}
              </Text>
              {!item.in_stock ? (
                <Text style={styles.itemNote}>
                  {item.substitute ? `Substituted: ${item.substitute}` : "Out of stock"}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </Card>

      {order.rating ? (
        <Card>
          <Text style={styles.sectionTitle}>Your rating</Text>
          <Text style={styles.bodyText}>
            {"★".repeat(order.rating)}
            {order.review ? ` — ${order.review}` : ""}
          </Text>
        </Card>
      ) : order.status === "completed" ? (
        <RatingForm onSubmit={handleRate} />
      ) : null}
    </ScrollView>
  );
}
