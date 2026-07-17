import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Receipt } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchMyTeam,
  fetchTeamBookingRevenue,
  fetchTeamPayoutRecords,
  fetchTeamPharmacyRevenue,
  fetchTeamRoster,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, Skeleton, StatusPill, curalinkPlusFonts, useTheme } from "@curalink/ui";


const payoutStatusColors: Record<string, { fg: string; bg: string }> = {
  pending: { fg: "#B45309", bg: "#FEF3E2" },
  processing: { fg: "#1D4ED8", bg: "#EAF1FE" },
  paid: { fg: "#0B5A45", bg: "#E8F5F0" },
  failed: { fg: "#DC3545", bg: "#FCE8E8" },
};

export default function BillingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 14 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
    statValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 19, color: colors.ink },
    statLabel: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: "center" },
    note: { fontSize: 11, color: colors.muted, textAlign: "center" },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink, marginTop: 6 },
    payoutRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    payoutIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#E8F5F0", alignItems: "center", justifyContent: "center" },
    payoutAmount: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    payoutDate: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
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

  const bookingRoleIds = (roster ?? []).filter((m) => m.role !== "pharmacy" && m.role !== "ambulance").map((m) => m.professional_id);
  const pharmacyIds = (roster ?? []).filter((m) => m.role === "pharmacy").map((m) => m.professional_id);
  const allIds = (roster ?? []).map((m) => m.professional_id);

  const { data: bookingRevenue } = useQuery({
    queryKey: ["teamBookingRevenue", team?.id],
    queryFn: () => fetchTeamBookingRevenue(bookingRoleIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });
  const { data: pharmacyRevenue } = useQuery({
    queryKey: ["teamPharmacyRevenue", team?.id],
    queryFn: () => fetchTeamPharmacyRevenue(pharmacyIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });
  const { data: payoutRecords } = useQuery({
    queryKey: ["teamPayoutRecords", team?.id],
    queryFn: () => fetchTeamPayoutRecords(allIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });

  const totalRevenue = (bookingRevenue ?? 0) + (pharmacyRevenue ?? 0);
  const pendingPayouts = payoutRecords?.filter((r) => r.status === "pending" || r.status === "processing") ?? [];
  const pendingTotal = pendingPayouts.reduce((total, r) => total + Number(r.amount), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Billing</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>₹{totalRevenue}</Text>
          <Text style={styles.statLabel}>Completed revenue</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>₹{pendingTotal}</Text>
          <Text style={styles.statLabel}>Pending payouts</Text>
        </Card>
      </View>
      <Text style={styles.note}>
        Ambulance trips aren&apos;t priced in this build yet, so they&apos;re not included in revenue.
      </Text>

      <Text style={styles.sectionTitle}>Payout records</Text>
      {payoutRecords === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : payoutRecords.length === 0 ? (
        <EmptyState icon={<Receipt size={26} color={colors.primary} strokeWidth={1.6} />} title="No payout records yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {payoutRecords.map((record) => (
            <Card key={record.id} style={styles.payoutRow}>
              <View style={styles.payoutIcon}>
                <IndianRupee size={16} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutAmount}>₹{record.amount}</Text>
                <Text style={styles.payoutDate}>
                  {record.paid_at ? new Date(record.paid_at).toLocaleDateString("en-IN") : "Pending"}
                </Text>
              </View>
              <StatusPill label={record.status} {...(payoutStatusColors[record.status] ?? { fg: colors.muted, bg: colors.border })} />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
