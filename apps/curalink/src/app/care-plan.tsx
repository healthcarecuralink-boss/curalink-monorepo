import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchFamilyMembers, fetchPastBookings, useSessionStore } from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";


export default function CarePlanScreen() {
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
    timeline: { gap: 0 },
    timelineRow: { flexDirection: "row", gap: 12 },
    timelineMarkerCol: { alignItems: "center", width: 16 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 16 },
    timelineLine: { flex: 1, width: 2, backgroundColor: colors.border2 },
    timelineCard: { flex: 1, marginBottom: 12, gap: 4 },
    timelineDate: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13, color: colors.ink },
    timelineNote: { fontSize: 12.5, color: colors.ink2, lineHeight: 18 },
    timelineHandoff: { fontSize: 12, color: colors.muted2, lineHeight: 17, fontStyle: "italic" },
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
  const { data: pastBookings } = useQuery({
    queryKey: ["pastBookings", userId],
    queryFn: () => fetchPastBookings(userId as string),
    enabled: Boolean(userId),
  });

  const activeMemberId = selectedMemberId ?? familyMembers?.[0]?.id ?? null;
  const timeline = (pastBookings ?? [])
    .filter((b) => !activeMemberId || b.patient_id === activeMemberId)
    .filter((b) => b.status === "completed")
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

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
        <Text style={styles.title}>Care plan</Text>
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

      {pastBookings === undefined ? (
        <Skeleton height={100} borderRadius={18} />
      ) : timeline.length === 0 ? (
        <EmptyState icon={<CalendarClock size={26} color={colors.primary} strokeWidth={1.6} />} title="No care history yet" />
      ) : (
        <View style={styles.timeline}>
          {timeline.map((booking, i) => (
            <View key={booking.id} style={styles.timelineRow}>
              <View style={styles.timelineMarkerCol}>
                <View style={styles.timelineDot} />
                {i < timeline.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <Card style={styles.timelineCard}>
                <Text style={styles.timelineDate}>{new Date(booking.scheduled_at).toLocaleDateString("en-IN")}</Text>
                {booking.notes ? <Text style={styles.timelineNote}>{booking.notes}</Text> : null}
                {booking.handoff_note ? <Text style={styles.timelineHandoff}>{booking.handoff_note}</Text> : null}
              </Card>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
