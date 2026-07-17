import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ambulance, ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchAmbulanceCompletedCounts,
  fetchMyTeam,
  fetchTeamRosterWithProfiles,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, Skeleton, StatusPill, curalinkPlusFonts, useTheme } from "@curalink/ui";

const statusColors: Record<string, { fg: string; bg: string }> = {
  active: { fg: "#0B5A45", bg: "#E8F5F0" },
  inactive: { fg: "#64748B", bg: "#EEF1F4" },
  suspended: { fg: "#DC3545", bg: "#FCE8E8" },
};

export default function AmbulanceFleetScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
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
        memberRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        memberIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#FCE8E8", alignItems: "center", justifyContent: "center" },
        memberName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        memberMeta: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const adminId = session?.user.id;

  const { data: team } = useQuery({
    queryKey: ["myTeam", adminId],
    queryFn: () => fetchMyTeam(adminId as string),
    enabled: Boolean(adminId),
  });
  const { data: roster } = useQuery({
    queryKey: ["teamRosterWithProfiles", team?.id],
    queryFn: () => fetchTeamRosterWithProfiles(team?.id as string),
    enabled: Boolean(team?.id),
  });

  const partners = (roster ?? []).filter((r) => r.member.role === "ambulance");
  const partnerIds = partners.map((r) => r.member.professional_id);

  const { data: completedCounts } = useQuery({
    queryKey: ["ambulanceCompletedCounts", partnerIds],
    queryFn: () => fetchAmbulanceCompletedCounts(partnerIds),
    enabled: partnerIds.length > 0,
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
        <Text style={styles.title}>Ambulance fleet</Text>
      </View>

      {roster === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : partners.length === 0 ? (
        <EmptyState icon={<Ambulance size={26} color={colors.primary} strokeWidth={1.6} />} title="No ambulance partners yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {partners.map(({ member, profile }) => (
            <Pressable key={member.id} onPress={() => router.push(`/team-member/${member.id}`)}>
              <Card style={styles.memberRow}>
                <View style={styles.memberIcon}>
                  <Ambulance size={17} color="#DC3545" strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{profile?.full_name ?? "Ambulance partner"}</Text>
                  <Text style={styles.memberMeta}>{completedCounts?.[member.professional_id] ?? 0} trips completed</Text>
                </View>
                <StatusPill label={member.status} {...(statusColors[member.status] ?? { fg: colors.muted, bg: colors.border })} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
