import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ambulance, ArrowRightLeft, AlertTriangle, BarChart3, ChevronRight, Map, Pill, ShieldCheck, Users } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  fetchEscalatedAmbulanceRequests,
  fetchEscalatedBookings,
  fetchMyTeam,
  fetchTeamRoster,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";

const accent = roleAccents.admin;

export function AdminHome() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { gap: 14 },
    metricsGrid: { flexDirection: "row", gap: 10 },
    metricCard: { flex: 1, paddingVertical: 16 },
    metricValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    metricLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },
    dispatchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.ink,
      borderRadius: 13,
      padding: 15,
    },
    dispatchTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: "#FFFFFF" },
    dispatchSubtitle: { fontSize: 11.5, color: "rgba(255,255,255,0.7)", marginTop: 2 },
    dispatchLink: { fontSize: 12, fontWeight: "700", color: "#5EEAD4" },
    reassignCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    reassignLabel: { fontSize: 13, fontWeight: "600", color: colors.ink },
    partnerRow: { flexDirection: "row", gap: 10 },
    partnerCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    partnerIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    partnerTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 12.5, color: colors.ink },
    partnerDetail: { fontSize: 11, color: colors.muted, marginTop: 2 },
    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
    seeAll: { fontSize: 12, fontWeight: "700" },
    memberRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    memberRole: { fontSize: 13, fontWeight: "600", color: colors.ink, textTransform: "capitalize" },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    complianceLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    complianceLinkLabel: { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.ink },
    alertCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#FCE8E8",
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 13,
      padding: 14,
    },
    alertTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 13.5, color: colors.error },
    alertSubtitle: { fontSize: 11.5, color: colors.error, opacity: 0.85, marginTop: 2 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const { data: team } = useQuery({
    queryKey: ["myTeam", userId],
    queryFn: () => fetchMyTeam(userId as string),
    enabled: Boolean(userId),
  });
  const { data: roster } = useQuery({
    queryKey: ["teamRoster", team?.id],
    queryFn: () => fetchTeamRoster(team?.id as string),
    enabled: Boolean(team?.id),
  });
  const { data: escalatedBookings } = useQuery({
    queryKey: ["escalatedBookings"],
    queryFn: fetchEscalatedBookings,
    refetchInterval: 60_000,
  });
  const { data: escalatedAmbulanceRequests } = useQuery({
    queryKey: ["escalatedAmbulanceRequests"],
    queryFn: fetchEscalatedAmbulanceRequests,
    refetchInterval: 60_000,
  });

  const activeCount = roster?.filter((m) => m.status === "active").length ?? 0;
  const pharmacyCount = roster?.filter((m) => m.role === "pharmacy").length ?? 0;
  const ambulanceCount = roster?.filter((m) => m.role === "ambulance").length ?? 0;
  const escalatedCount = (escalatedBookings?.length ?? 0) + (escalatedAmbulanceRequests?.length ?? 0);

  return (
    <View style={styles.container}>
      {escalatedCount > 0 ? (
        <Pressable style={styles.alertCard} onPress={() => router.push("/reassign-job")}>
          <AlertTriangle size={20} color={colors.error} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>
              {escalatedCount} job{escalatedCount > 1 ? "s" : ""} unaccepted past the usual window
            </Text>
            <Text style={styles.alertSubtitle}>Nobody&apos;s picked these up yet — step in and reassign.</Text>
          </View>
          <ChevronRight size={16} color={colors.error} />
        </Pressable>
      ) : null}

      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>{roster?.length ?? "—"}</Text>
          <Text style={styles.metricLabel}>Active team</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>{activeCount}</Text>
          <Text style={styles.metricLabel}>On duty now</Text>
        </Card>
      </View>

      <Pressable style={styles.dispatchCard} onPress={() => router.push("/(tabs)/dispatch")}>
        <Map size={18} color="#FFFFFF" strokeWidth={1.8} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dispatchTitle}>Live dispatch view</Text>
          <Text style={styles.dispatchSubtitle}>{activeCount} jobs in progress across Hyderabad</Text>
        </View>
        <Text style={styles.dispatchLink}>Open map →</Text>
      </Pressable>

      <Pressable style={styles.reassignCard} onPress={() => router.push("/reassign-job")}>
        <ArrowRightLeft size={16} color={accent} strokeWidth={1.8} />
        <Text style={styles.reassignLabel}>Reassign a job</Text>
      </Pressable>

      <View style={styles.partnerRow}>
        <Pressable style={styles.partnerCard} onPress={() => router.push("/pharmacy-network")}>
          <View style={[styles.partnerIcon, { backgroundColor: "#E0F2FE" }]}>
            <Pill size={18} color="#0EA5E9" strokeWidth={1.8} />
          </View>
          <Text style={styles.partnerTitle}>Pharmacy network</Text>
          <Text style={styles.partnerDetail}>{pharmacyCount} partners</Text>
        </Pressable>
        <Pressable style={styles.partnerCard} onPress={() => router.push("/ambulance-fleet")}>
          <View style={[styles.partnerIcon, { backgroundColor: "#FCE8E8" }]}>
            <Ambulance size={18} color="#DC3545" strokeWidth={1.8} />
          </View>
          <Text style={styles.partnerTitle}>Ambulance fleet</Text>
          <Text style={styles.partnerDetail}>{ambulanceCount} partners</Text>
        </Pressable>
      </View>

      <Pressable style={styles.complianceLink} onPress={() => router.push("/analytics")}>
        <BarChart3 size={18} color={accent} strokeWidth={1.8} />
        <Text style={styles.complianceLinkLabel}>Analytics & reports</Text>
        <ChevronRight size={16} color={colors.muted} />
      </Pressable>

      <Pressable style={styles.complianceLink} onPress={() => router.push("/compliance")}>
        <ShieldCheck size={18} color={accent} strokeWidth={1.8} />
        <Text style={styles.complianceLinkLabel}>Compliance</Text>
        <ChevronRight size={16} color={colors.muted} />
      </Pressable>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Team snapshot</Text>
        <Text style={[styles.seeAll, { color: accent }]} onPress={() => router.push("/(tabs)/team")}>
          Manage
        </Text>
      </View>
      {roster === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : roster.length === 0 ? (
        <EmptyState icon={<Users size={26} color={accent} strokeWidth={1.6} />} title="No team yet" body="Add team members from the Team tab." />
      ) : (
        <View style={{ gap: 8 }}>
          {roster.slice(0, 4).map((member) => (
            <Pressable key={member.id} onPress={() => router.push(`/team-member/${member.id}`)}>
              <Card style={styles.memberRow}>
                <Text style={styles.memberRole}>{member.role}</Text>
                <View style={[styles.statusDot, { backgroundColor: member.status === "active" ? accent : colors.muted }]} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
