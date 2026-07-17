import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Star, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchFamilyMembers, fetchMedicalTeam, useSessionStore } from "@curalink/api-client";
import { EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";


export default function MedicalTeamScreen() {
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
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 16,
      padding: 14,
    },
    memberName: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
    memberMeta: { fontSize: 11.5, color: colors.muted2 },
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

  const { data: team } = useQuery({
    queryKey: ["medicalTeam", activeMemberId],
    queryFn: () => fetchMedicalTeam(activeMemberId as string),
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
        <Text style={styles.title}>Medical team</Text>
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

      {team === undefined ? (
        <Skeleton height={70} borderRadius={16} />
      ) : team.length === 0 ? (
        <EmptyState icon={<Users size={26} color={colors.primary} strokeWidth={1.6} />} title="No care team yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {team.map((member) => (
            <Pressable key={member.profileId} style={styles.memberRow} onPress={() => router.push(`/provider/${member.profileId}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.fullName}</Text>
                <View style={styles.ratingRow}>
                  <Star size={12} color={colors.star} fill={colors.star} />
                  <Text style={styles.memberMeta}>
                    {member.rating.toFixed(1)} · {member.visitCount} visit{member.visitCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.faint2} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
