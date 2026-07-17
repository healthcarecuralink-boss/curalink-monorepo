import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, IndianRupee, Star, TrendingUp } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchMyTeam,
  fetchTeamAllBookings,
  fetchTeamMemberRatings,
  fetchTeamPharmacyRevenue,
  fetchTeamRosterWithProfiles,
  useSessionStore,
} from "@curalink/api-client";
import { Card, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(d: Date): Date {
  const copy = startOfDay(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy;
}

function startOfMonth(d: Date): Date {
  const copy = startOfDay(d);
  copy.setDate(1);
  return copy;
}

export default function AnalyticsScreen() {
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
        statsRow: { flexDirection: "row", gap: 10 },
        statCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
        statValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 18, color: colors.ink },
        statLabel: { fontSize: 10.5, color: colors.muted, marginTop: 4, textAlign: "center" },
        sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
        breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
        breakdownLabel: { fontSize: 12.5, color: colors.muted, textTransform: "capitalize" },
        breakdownValue: { fontSize: 12.5, fontWeight: "700", color: colors.ink },
        memberRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
        memberName: { fontSize: 12.5, fontWeight: "600", color: colors.ink, flex: 1 },
        memberRating: { fontSize: 12, fontWeight: "700", color: colors.ink },
        reportsLink: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: colors.ink,
          borderRadius: 13,
          padding: 15,
        },
        reportsLinkText: { flex: 1, fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: "#FFFFFF" },
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

  const bookingRoleIds = (roster ?? [])
    .filter((r) => r.member.role !== "pharmacy" && r.member.role !== "ambulance")
    .map((r) => r.member.professional_id);
  const pharmacyIds = (roster ?? []).filter((r) => r.member.role === "pharmacy").map((r) => r.member.professional_id);

  const { data: bookings } = useQuery({
    queryKey: ["teamAllBookings", team?.id],
    queryFn: () => fetchTeamAllBookings(bookingRoleIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });
  const { data: pharmacyRevenue } = useQuery({
    queryKey: ["teamPharmacyRevenue", team?.id],
    queryFn: () => fetchTeamPharmacyRevenue(pharmacyIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });
  const { data: ratings } = useQuery({
    queryKey: ["teamMemberRatings", team?.id],
    queryFn: () => fetchTeamMemberRatings(bookingRoleIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const completed = (bookings ?? []).filter((b) => b.status === "completed");
  const revenueOf = (list: typeof completed) => list.reduce((total, b) => total + Number(b.price) + Number(b.tip_amount), 0);

  const todayRevenue = revenueOf(completed.filter((b) => new Date(b.scheduled_at) >= todayStart));
  const weekRevenue = revenueOf(completed.filter((b) => new Date(b.scheduled_at) >= weekStart));
  const monthRevenue = revenueOf(completed.filter((b) => new Date(b.scheduled_at) >= monthStart));
  const allTimeRevenue = revenueOf(completed) + (pharmacyRevenue ?? 0);

  const statusCounts = (bookings ?? []).reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const topRated = [...(roster ?? [])]
    .filter((r) => r.member.role !== "pharmacy" && r.member.role !== "ambulance")
    .sort((a, b) => (ratings?.[b.member.professional_id] ?? 0) - (ratings?.[a.member.professional_id] ?? 0))
    .slice(0, 5);

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
        <Text style={styles.title}>Analytics</Text>
      </View>

      {bookings === undefined ? (
        <Skeleton height={100} borderRadius={13} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>₹{todayRevenue}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>₹{weekRevenue}</Text>
              <Text style={styles.statLabel}>This week</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>₹{monthRevenue}</Text>
              <Text style={styles.statLabel}>This month</Text>
            </Card>
          </View>

          <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <IndianRupee size={20} color={colors.primary} strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>All-time revenue (bookings + pharmacy)</Text>
              <Text style={{ fontFamily: curalinkPlusFonts.heading, fontSize: 18, color: colors.ink, marginTop: 2 }}>
                ₹{allTimeRevenue}
              </Text>
            </View>
            <TrendingUp size={18} color={colors.muted} strokeWidth={1.6} />
          </Card>

          <Text style={styles.sectionTitle}>Bookings by status</Text>
          <Card>
            {Object.keys(statusCounts).length === 0 ? (
              <Text style={{ fontSize: 12.5, color: colors.muted }}>No bookings yet.</Text>
            ) : (
              Object.entries(statusCounts).map(([status, count]) => (
                <View key={status} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{status.replace("_", " ")}</Text>
                  <Text style={styles.breakdownValue}>{count}</Text>
                </View>
              ))
            )}
          </Card>

          <Text style={styles.sectionTitle}>Team ratings</Text>
          <Card>
            {topRated.length === 0 ? (
              <Text style={{ fontSize: 12.5, color: colors.muted }}>No team members yet.</Text>
            ) : (
              topRated.map(({ member, profile }) => (
                <View key={member.id} style={styles.memberRow}>
                  <Star size={14} color="#F4A23B" fill="#F4A23B" />
                  <Text style={styles.memberName}>{profile?.full_name ?? member.role}</Text>
                  <Text style={styles.memberRating}>{(ratings?.[member.professional_id] ?? 0).toFixed(1)}</Text>
                </View>
              ))
            )}
          </Card>

          <Pressable style={styles.reportsLink} onPress={() => router.push("/reports")}>
            <Text style={styles.reportsLinkText}>Export reports (CSV)</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
