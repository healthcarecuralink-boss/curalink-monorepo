import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, IndianRupee, Wallet } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchCompletedBookingsSince,
  fetchPayoutRecords,
  fetchProfessionalProfile,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, ErrorState, Skeleton, StatusPill, curalinkPlusFonts, useTheme } from "@curalink/ui";


function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - d.getDay());
  return d;
}
function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

const payoutStatusColors: Record<string, { fg: string; bg: string }> = {
  pending: { fg: "#B45309", bg: "#FEF3E2" },
  processing: { fg: "#1D4ED8", bg: "#EAF1FE" },
  paid: { fg: "#0B5A45", bg: "#E8F5F0" },
  failed: { fg: "#DC3545", bg: "#FCE8E8" },
};

export default function EarningsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 14 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
    monthCard: { alignItems: "center", paddingVertical: 16 },
    statValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 19, color: colors.ink },
    statLabel: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: "center" },
    ratingCard: { flexDirection: "row", alignItems: "center", gap: 12 },
    ratingIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#E8F5F0", alignItems: "center", justifyContent: "center" },
    ratingLabel: { fontSize: 11.5, color: colors.muted },
    ratingValue: { fontSize: 16, fontWeight: "700", color: colors.ink, marginTop: 2 },
    payoutMethodsLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    payoutMethodsLabel: { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.ink },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink, marginTop: 6 },
    payoutRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    payoutAmount: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    payoutDate: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
    note: { fontSize: 11, color: colors.muted, textAlign: "center" },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const { data: professionalProfile } = useQuery({
    queryKey: ["professionalProfile", userId],
    queryFn: () => fetchProfessionalProfile(userId as string),
    enabled: Boolean(userId),
  });
  const { data: todayBookings } = useQuery({
    queryKey: ["earnings", userId, "today"],
    queryFn: () => fetchCompletedBookingsSince(userId as string, startOfToday()),
    enabled: Boolean(userId),
  });
  const { data: weekBookings } = useQuery({
    queryKey: ["earnings", userId, "week"],
    queryFn: () => fetchCompletedBookingsSince(userId as string, startOfWeek()),
    enabled: Boolean(userId),
  });
  const { data: monthBookings } = useQuery({
    queryKey: ["earnings", userId, "month"],
    queryFn: () => fetchCompletedBookingsSince(userId as string, startOfMonth()),
    enabled: Boolean(userId),
  });
  const {
    data: payoutRecords,
    isError: payoutRecordsError,
    refetch: refetchPayoutRecords,
  } = useQuery({
    queryKey: ["payoutRecords", userId],
    queryFn: () => fetchPayoutRecords(userId as string),
    enabled: Boolean(userId),
  });

  const sumEarnings = (bookings?: { price: number; tip_amount: number }[]) =>
    bookings?.reduce((total, b) => total + Number(b.price) + Number(b.tip_amount), 0) ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>₹{sumEarnings(todayBookings)}</Text>
          <Text style={styles.statLabel}>Today · {todayBookings?.length ?? 0} visits</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>₹{sumEarnings(weekBookings)}</Text>
          <Text style={styles.statLabel}>This week · {weekBookings?.length ?? 0} visits</Text>
        </Card>
      </View>
      <Card style={styles.monthCard}>
        <Text style={styles.statValue}>₹{sumEarnings(monthBookings)}</Text>
        <Text style={styles.statLabel}>This month · {monthBookings?.length ?? 0} visits</Text>
      </Card>

      <Card style={styles.ratingCard}>
        <View style={styles.ratingIcon}>
          <IndianRupee size={20} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View>
          <Text style={styles.ratingLabel}>Your rating</Text>
          {professionalProfile === undefined ? (
            <Skeleton width={80} height={24} borderRadius={6} />
          ) : (
            <Text style={styles.ratingValue}>
              ★ {professionalProfile?.rating.toFixed(1)} ({professionalProfile?.rating_count} jobs)
            </Text>
          )}
        </View>
      </Card>

      <Pressable style={styles.payoutMethodsLink} onPress={() => router.push("/payout-methods")}>
        <Wallet size={18} color={colors.primary} strokeWidth={1.8} />
        <Text style={styles.payoutMethodsLabel}>Payout methods</Text>
        <ChevronRight size={16} color={colors.muted} />
      </Pressable>

      <Text style={styles.sectionTitle}>Payout history</Text>
      {payoutRecordsError ? (
        <ErrorState onRetry={() => void refetchPayoutRecords()} />
      ) : payoutRecords === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : payoutRecords.length === 0 ? (
        <EmptyState icon={<IndianRupee size={26} color={colors.primary} strokeWidth={1.6} />} title="No payouts yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {payoutRecords.map((record) => (
            <Card key={record.id} style={styles.payoutRow}>
              <View>
                <Text style={styles.payoutAmount}>₹{record.amount}</Text>
                <Text style={styles.payoutDate}>
                  {record.paid_at ? new Date(record.paid_at).toLocaleDateString("en-IN") : "Pending"}
                </Text>
              </View>
              <StatusPill
                label={record.status}
                {...(payoutStatusColors[record.status] ?? { fg: colors.muted, bg: colors.border })}
              />
            </Card>
          ))}
        </View>
      )}

      <Text style={styles.note}>Withdraw-on-demand needs Razorpay (RazorpayX) — lands with Step 6.</Text>
    </ScrollView>
  );
}
