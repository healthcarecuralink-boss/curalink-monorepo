import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Beaker, Check, FileText } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createLabOrder, fetchFamilyMembers, fetchLabOrders, useSessionStore } from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, StatusPill, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";


const availableTests = [
  "Complete Blood Count (CBC)",
  "Lipid Profile",
  "Thyroid Panel (TSH)",
  "Blood Sugar (Fasting)",
  "Vitamin D",
  "Urine Routine",
];

export default function LabOrdersScreen() {
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
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: { backgroundColor: "#E9FBF3", borderColor: colors.primary },
    chipText: { fontSize: 12.5, fontWeight: "600", color: colors.muted },
    chipTextSelected: { color: colors.primaryPress },
    testRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    testName: { fontSize: 13, color: colors.ink },
    orderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    orderTests: { fontSize: 13, fontWeight: "700", color: colors.ink },
    orderMeta: { fontSize: 11, color: colors.muted2, marginTop: 2 },
    reportRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
    reportLabel: { fontSize: 11.5, fontWeight: "600", color: colors.primary },
    pendingNote: { fontSize: 10.5, color: colors.muted2, marginTop: 4 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const consumerId = session?.user.id;
  const queryClient = useQueryClient();

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const { data: familyMembers } = useQuery({
    queryKey: ["familyMembers", consumerId],
    queryFn: () => fetchFamilyMembers(consumerId as string),
    enabled: Boolean(consumerId),
  });
  const { data: orders } = useQuery({
    queryKey: ["labOrders", consumerId],
    queryFn: () => fetchLabOrders(consumerId as string),
    enabled: Boolean(consumerId),
  });

  const activePatientId = patientId ?? familyMembers?.[0]?.id ?? null;

  function toggleTest(test: string) {
    setSelectedTests((prev) => (prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]));
  }

  async function handleBook() {
    if (!consumerId || selectedTests.length === 0) return;
    setIsBooking(true);
    try {
      await createLabOrder({
        consumer_id: consumerId,
        patient_id: activePatientId,
        tests: selectedTests,
        status: "pending",
      });
      setSelectedTests([]);
      void queryClient.invalidateQueries({ queryKey: ["labOrders", consumerId] });
    } finally {
      setIsBooking(false);
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
        <Text style={styles.title}>Lab reports</Text>
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Book a test</Text>

        {familyMembers && familyMembers.length > 1 ? (
          <View style={styles.chipRow}>
            {familyMembers.map((member) => {
              const isSelected = member.id === activePatientId;
              return (
                <Pressable
                  key={member.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setPatientId(member.id)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{member.full_name}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          {availableTests.map((test) => {
            const isSelected = selectedTests.includes(test);
            return (
              <Pressable key={test} style={styles.testRow} onPress={() => toggleTest(test)}>
                <View style={[styles.checkbox, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {isSelected ? <Check size={13} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.testName}>{test}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={isBooking ? "Booking..." : "Book selected tests"}
          disabled={selectedTests.length === 0 || isBooking}
          onPress={() => void handleBook()}
        />
      </Card>

      <Text style={styles.sectionTitle}>Your orders</Text>
      {orders === undefined ? (
        <Skeleton height={70} borderRadius={16} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Beaker size={26} color={colors.primary} strokeWidth={1.6} />} title="No lab orders yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {orders.map((order) => (
            <Card key={order.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTests}>{order.tests.join(", ")}</Text>
                <Text style={styles.orderMeta}>{new Date(order.created_at).toLocaleDateString("en-IN")}</Text>
                {order.file_url ? (
                  <View style={styles.reportRow}>
                    <FileText size={13} color={colors.primary} strokeWidth={1.8} />
                    <Text style={styles.reportLabel}>Report available</Text>
                  </View>
                ) : (
                  <Text style={styles.pendingNote}>Results appear here once a lab visits and uploads your report.</Text>
                )}
              </View>
              <StatusPill
                label={order.status}
                {...(order.status === "pending" ? curalinkStatusPillColors.pending : curalinkStatusPillColors.completed)}
              />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
