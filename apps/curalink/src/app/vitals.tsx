import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Activity } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchFamilyMembers, fetchVitalsHistory, useSessionStore } from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";


export default function VitalsScreen() {
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
    visitDate: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13, color: colors.ink, marginBottom: 8 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.divider },
    label: { fontSize: 12, color: colors.muted, textTransform: "capitalize" },
    value: { fontSize: 12.5, color: colors.ink, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 12 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { data: familyMembers } = useQuery({
    queryKey: ["familyMembers", userId],
    queryFn: () => fetchFamilyMembers(userId as string),
    enabled: Boolean(userId),
  });

  const activeMemberId = selectedMemberId ?? familyMembers?.[0]?.id ?? null;

  const { data: history } = useQuery({
    queryKey: ["vitalsHistory", activeMemberId],
    queryFn: () => fetchVitalsHistory(activeMemberId as string),
    enabled: Boolean(activeMemberId),
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
        <Text style={styles.title}>Vitals</Text>
      </View>

      {familyMembers && familyMembers.length > 1 ? (
        <View style={styles.chipRow}>
          {familyMembers.map((member) => {
            const isSelected = member.id === activeMemberId;
            return (
              <Pressable
                key={member.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedMemberId(member.id)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{member.full_name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {history === undefined ? (
        <Skeleton height={100} borderRadius={18} />
      ) : history.length === 0 ? (
        <EmptyState icon={<Activity size={26} color={colors.primary} strokeWidth={1.6} />} title="No vitals recorded yet" />
      ) : (
        <View style={{ gap: 12 }}>
          {history.map((booking) => {
            const vitals = booking.vitals as Record<string, string>;
            return (
              <Card key={booking.id}>
                <Text style={styles.visitDate}>{new Date(booking.scheduled_at).toLocaleString("en-IN")}</Text>
                {Object.entries(vitals).map(([key, value]) => (
                  <View key={key} style={styles.row}>
                    <Text style={styles.label}>{key}</Text>
                    <Text style={styles.value}>{String(value)}</Text>
                  </View>
                ))}
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
