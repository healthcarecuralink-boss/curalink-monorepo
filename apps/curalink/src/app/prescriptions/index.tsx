import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Stethoscope } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchFamilyMembers, fetchPrescriptionsForOwner, useSessionStore, type Json } from "@curalink/api-client";
import { EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";


export default function PrescriptionsLibraryScreen() {
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
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 16,
      padding: 15,
    },
    patientName: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    meta: { fontSize: 11.5, color: colors.muted2, marginTop: 3 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const { data: prescriptions } = useQuery({
    queryKey: ["prescriptions", userId],
    queryFn: () => fetchPrescriptionsForOwner(userId as string),
    enabled: Boolean(userId),
  });
  const { data: familyMembers } = useQuery({
    queryKey: ["familyMembers", userId],
    queryFn: () => fetchFamilyMembers(userId as string),
    enabled: Boolean(userId),
  });

  const patientName = (patientId: string) => familyMembers?.find((f) => f.id === patientId)?.full_name ?? "Patient";
  const medCount = (meds: Json) => (Array.isArray(meds) ? meds.length : 0);

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
        <Text style={styles.title}>Prescriptions</Text>
      </View>

      {prescriptions === undefined ? (
        <Skeleton height={80} borderRadius={16} />
      ) : prescriptions.length === 0 ? (
        <EmptyState icon={<Stethoscope size={26} color={colors.primary} strokeWidth={1.6} />} title="No prescriptions yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {prescriptions.map((rx) => (
            <Pressable key={rx.id} style={styles.card} onPress={() => router.push(`/prescriptions/${rx.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{patientName(rx.patient_id)}</Text>
                <Text style={styles.meta}>
                  {medCount(rx.meds)} medicine{medCount(rx.meds) === 1 ? "" : "s"} · {new Date(rx.issued_at).toLocaleDateString("en-IN")}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.faint2} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
