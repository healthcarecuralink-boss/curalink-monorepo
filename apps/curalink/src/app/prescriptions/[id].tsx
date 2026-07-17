import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pill } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { createPharmacyOrderFromPrescription, fetchPrescriptionDetail, useSessionStore } from "@curalink/api-client";
import { Button, Card, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";


interface Med {
  name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export default function PrescriptionDetailScreen() {
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
    subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: colors.ink, marginBottom: 10 },
    medRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.divider },
    medName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
    medMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
    bodyText: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
        }),
      [colors],
    );
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionStore((s) => s.session);
  const [isOrdering, setIsOrdering] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ["prescriptionDetail", id],
    queryFn: () => fetchPrescriptionDetail(id),
    enabled: Boolean(id),
  });

  async function handleOrderMedicines() {
    const consumerId = session?.user.id;
    if (!consumerId || !detail) return;
    setIsOrdering(true);
    try {
      const order = await createPharmacyOrderFromPrescription({
        consumer_id: consumerId,
        patient_id: detail.prescription.patient_id,
        prescription_id: detail.prescription.id,
        items: (detail.prescription.meds as Med[]).map((med) => ({
          name: med.name,
          qty: 1,
          in_stock: true,
        })) as never,
      });
      router.replace(`/pharmacy-orders/${order.id}`);
    } finally {
      setIsOrdering(false);
    }
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={18} />
      </View>
    );
  }

  const { prescription, patientName, doctorName } = detail;
  const meds = prescription.meds as Med[];

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
        <View>
          <Text style={styles.title}>{patientName}</Text>
          <Text style={styles.subtitle}>
            {doctorName} · {new Date(prescription.issued_at).toLocaleDateString("en-IN")}
          </Text>
        </View>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Medicines</Text>
        {meds.map((med, i) => (
          <View key={i} style={styles.medRow}>
            <Pill size={16} color={colors.primary} strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medMeta}>
                {[med.dosage, med.frequency, med.duration].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {prescription.advice ? (
        <Card>
          <Text style={styles.sectionTitle}>Doctor&apos;s advice</Text>
          <Text style={styles.bodyText}>{prescription.advice}</Text>
        </Card>
      ) : null}

      <Button
        label={isOrdering ? "Placing order..." : "Order these medicines"}
        disabled={isOrdering}
        onPress={() => void handleOrderMedicines()}
      />
      <Button
        label="Find a nearby pharmacy instead"
        variant="secondary"
        onPress={() => router.push({ pathname: "/pharmacy-locator", params: { prescriptionId: id } })}
      />
    </ScrollView>
  );
}
