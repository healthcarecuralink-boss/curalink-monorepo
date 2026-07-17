import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, MapPin, Package } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  advancePharmacyOrderStatus,
  claimPharmacyOrder,
  fetchPharmacyOrderDetail,
  updatePharmacyOrderItems,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, Skeleton, StatusPill, TextField, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";

const accent = roleAccents.pharmacy;

interface OrderItem {
  name: string;
  qty: number;
  in_stock: boolean;
  substitute?: string;
  price?: number;
}

const statusColors: Record<string, { fg: string; bg: string }> = {
  placed: { fg: "#B45309", bg: "#FEF3E2" },
  preparing: { fg: "#1D4ED8", bg: "#EAF1FE" },
  ready: { fg: "#1D4ED8", bg: "#EAF1FE" },
  picked_up: { fg: "#0B5A45", bg: "#E8F5F0" },
  completed: { fg: "#0B5A45", bg: "#E8F5F0" },
  cancelled: { fg: "#64748B", bg: "#EEF1F4" },
};

const nextStep: Record<string, { status: "preparing" | "ready" | "picked_up" | "completed"; label: string } | undefined> = {
  preparing: { status: "ready", label: "Mark ready for pickup" },
  ready: { status: "picked_up", label: "Rider picked up" },
  picked_up: { status: "completed", label: "Mark delivered" },
};

export default function PharmacyOrderDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 14 },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 16, color: colors.ink },
    subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
    pickupCard: { flexDirection: "row", alignItems: "center", gap: 12, borderColor: accent, borderWidth: 1.5 },
    pickupLabel: { fontSize: 11.5, color: colors.muted },
    pickupCode: { fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink, letterSpacing: 2 },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    itemRow: { gap: 8 },
    itemCheck: { flexDirection: "row", alignItems: "center", gap: 10 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    itemName: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
    itemStatus: { fontSize: 11, color: colors.muted, marginTop: 1 },
        }),
      [colors],
    );
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const { data: detail } = useQuery({
    queryKey: ["pharmacyOrderDetail", id],
    queryFn: () => fetchPharmacyOrderDetail(id),
    enabled: Boolean(id),
  });

  if (detail && detail.order.id !== loadedOrderId) {
    setLoadedOrderId(detail.order.id);
    setItems(Array.isArray(detail.order.items) ? (detail.order.items as unknown as OrderItem[]) : []);
  }

  async function handleClaim() {
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await claimPharmacyOrder(id, userId);
      void queryClient.invalidateQueries({ queryKey: ["pharmacyOrderDetail", id] });
      void queryClient.invalidateQueries({ queryKey: ["incomingPharmacyOrders"] });
      void queryClient.invalidateQueries({ queryKey: ["activePharmacyOrders"] });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveItems() {
    setIsSubmitting(true);
    try {
      await updatePharmacyOrderItems(id, items as never);
      void queryClient.invalidateQueries({ queryKey: ["pharmacyOrderDetail", id] });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdvance(status: "preparing" | "ready" | "picked_up" | "completed") {
    setIsSubmitting(true);
    try {
      await advancePharmacyOrderStatus(id, status);
      void queryClient.invalidateQueries({ queryKey: ["pharmacyOrderDetail", id] });
      void queryClient.invalidateQueries({ queryKey: ["pharmacyOrderHistory"] });
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleInStock(index: number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, in_stock: !item.in_stock } : item)));
  }

  function setSubstitute(index: number, substitute: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, substitute } : item)));
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={13} />
      </View>
    );
  }

  const { order, patientName } = detail;
  const step = nextStep[order.status];

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
          {patientName ? <Text style={styles.subtitle}>for {patientName}</Text> : null}
        </View>
        <StatusPill
          label={order.status.replace("_", " ")}
          {...(statusColors[order.status] ?? { fg: colors.muted, bg: colors.border })}
        />
      </View>

      {order.status !== "placed" && order.status !== "cancelled" ? (
        <Card style={styles.pickupCard}>
          <MapPin size={18} color={accent} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pickupLabel}>Rider pickup code</Text>
            <Text style={styles.pickupCode}>{order.pickup_code}</Text>
          </View>
        </Card>
      ) : null}

      <Card style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Items — stock check</Text>
        {items.map((item, i) => (
          <View key={`${item.name}-${i}`} style={styles.itemRow}>
            <Pressable style={styles.itemCheck} onPress={() => toggleInStock(i)} disabled={order.status === "completed"}>
              <View style={[styles.checkbox, item.in_stock && { backgroundColor: accent, borderColor: accent }]}>
                {item.in_stock ? <Check size={13} color="#FFFFFF" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.name} × {item.qty}
                </Text>
                <Text style={styles.itemStatus}>{item.in_stock ? "In stock" : "Out of stock"}</Text>
              </View>
            </Pressable>
            {!item.in_stock ? (
              <TextField
                placeholder="Substitute medicine (optional)"
                value={item.substitute ?? ""}
                onChangeText={(value) => setSubstitute(i, value)}
                editable={order.status !== "completed"}
              />
            ) : null}
          </View>
        ))}
        {order.status !== "completed" && order.status !== "cancelled" ? (
          <Button
            label={isSubmitting ? "Saving..." : "Save item updates"}
            variant="secondary"
            disabled={isSubmitting}
            onPress={() => void handleSaveItems()}
          />
        ) : null}
      </Card>

      {order.status === "placed" ? (
        <Button
          label={isSubmitting ? "Accepting..." : "Accept order & start preparing"}
          icon={<Package size={16} color="#FFFFFF" />}
          disabled={isSubmitting}
          onPress={() => void handleClaim()}
        />
      ) : null}

      {step ? (
        <Button
          label={isSubmitting ? "Updating..." : step.label}
          disabled={isSubmitting}
          onPress={() => void handleAdvance(step.status)}
        />
      ) : null}
    </ScrollView>
  );
}
