import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchPrescriptionsByDoctor, useSessionStore } from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";

interface MedEntry {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export default function PrescriptionHistoryScreen() {
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
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink },
        prescriptionDate: { fontSize: 11, color: colors.muted, marginBottom: 6 },
        medRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
        medText: { fontSize: 12.5, color: colors.ink },
        advice: { fontSize: 12, color: colors.muted, marginTop: 6, fontStyle: "italic" },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const doctorId = session?.user.id;

  const { data: prescriptions } = useQuery({
    queryKey: ["prescriptionsByDoctor", doctorId],
    queryFn: () => fetchPrescriptionsByDoctor(doctorId as string),
    enabled: Boolean(doctorId),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Prescriptions</Text>
      </View>

      {prescriptions === undefined ? (
        <Skeleton height={90} borderRadius={13} />
      ) : prescriptions.length === 0 ? (
        <EmptyState icon={<FileText size={26} color={colors.primary} strokeWidth={1.6} />} title="No prescriptions written yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {prescriptions.map((prescription) => {
            const meds = Array.isArray(prescription.meds) ? (prescription.meds as unknown as MedEntry[]) : [];
            return (
              <Card key={prescription.id}>
                <Text style={styles.prescriptionDate}>{new Date(prescription.issued_at).toLocaleString("en-IN")}</Text>
                {meds.map((med, i) => (
                  <View key={i} style={styles.medRow}>
                    <Text style={styles.medText}>
                      • {med.name} {[med.dosage, med.frequency, med.duration].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                ))}
                {prescription.advice ? <Text style={styles.advice}>{prescription.advice}</Text> : null}
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
