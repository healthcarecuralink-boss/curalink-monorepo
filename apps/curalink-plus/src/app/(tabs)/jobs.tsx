import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchActiveJob,
  fetchAvailableJobs,
  fetchJobHistory,
  useSessionStore,
} from "@curalink/api-client";
import { EmptyState, ErrorState, Skeleton, StatusPill, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";


const tabs = ["available", "accepted", "history"] as const;
type Tab = (typeof tabs)[number];

const statusColors: Record<string, { fg: string; bg: string }> = {
  pending: { fg: "#B45309", bg: "#FEF3E2" },
  confirmed: { fg: "#1D4ED8", bg: "#EAF1FE" },
  en_route: { fg: "#1D4ED8", bg: "#EAF1FE" },
  in_progress: { fg: "#0B5A45", bg: "#E8F5F0" },
  completed: { fg: "#0B5A45", bg: "#E8F5F0" },
  cancelled: { fg: "#64748B", bg: "#EEF1F4" },
};

export default function JobsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    tabRow: { flexDirection: "row", gap: 8 },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabText: { fontSize: 12.5, fontWeight: "700", color: colors.muted, textTransform: "capitalize" },
    tabTextActive: { color: "#FFFFFF" },
    jobCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    jobPrice: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    jobMeta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
        }),
      [colors],
    );
  const [tab, setTab] = useState<Tab>("available");
  const session = useSessionStore((s) => s.session);
  const activeRole = useSessionStore((s) => s.activeRole);
  const userId = session?.user.id;
  const accent = activeRole ? roleAccents[activeRole] : colors.primary;

  const {
    data: available,
    isError: availableError,
    refetch: refetchAvailable,
  } = useQuery({
    queryKey: ["availableJobs", activeRole],
    queryFn: () => fetchAvailableJobs(activeRole as string),
    enabled: Boolean(activeRole) && tab === "available",
  });
  const {
    data: activeJob,
    isError: activeJobError,
    refetch: refetchActiveJob,
  } = useQuery({
    queryKey: ["activeJob", userId],
    queryFn: () => fetchActiveJob(userId as string),
    enabled: Boolean(userId) && tab === "accepted",
  });
  const {
    data: history,
    isError: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["jobHistory", userId],
    queryFn: () => fetchJobHistory(userId as string),
    enabled: Boolean(userId) && tab === "history",
  });

  const listForTab = tab === "available" ? available : tab === "accepted" ? (activeJob ? [activeJob] : []) : history;
  const listError = tab === "available" ? availableError : tab === "accepted" ? activeJobError : historyError;
  const refetchList = tab === "available" ? refetchAvailable : tab === "accepted" ? refetchActiveJob : refetchHistory;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Jobs</Text>

      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {listError ? (
        <ErrorState onRetry={() => void refetchList()} />
      ) : listForTab === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : listForTab.length === 0 ? (
        <EmptyState icon={<Briefcase size={26} color={accent} strokeWidth={1.6} />} title={`No ${tab} jobs`} />
      ) : (
        <View style={{ gap: 10 }}>
          {listForTab.map((job) => (
            <Pressable key={job.id} style={styles.jobCard} onPress={() => router.push(`/jobs/${job.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobPrice}>₹{job.price}</Text>
                <Text style={styles.jobMeta}>{new Date(job.scheduled_at).toLocaleString("en-IN")}</Text>
              </View>
              <StatusPill
                label={job.status.replace("_", " ")}
                {...(statusColors[job.status] ?? { fg: colors.muted, bg: colors.border })}
              />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
