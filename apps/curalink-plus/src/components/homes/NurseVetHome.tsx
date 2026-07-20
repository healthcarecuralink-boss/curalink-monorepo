import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { IndianRupee, MapPin, Star } from "lucide-react-native";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import {
  fetchActiveJob,
  fetchAvailableJobs,
  fetchProfessionalProfile,
  setOnDuty,
  subscribeToAvailableJobs,
  useSessionStore,
  type ProfessionalRole,
} from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";


export function NurseVetHome({ role }: { role: Extract<ProfessionalRole, "nurse" | "vet"> }) {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { gap: 14 },
    dutyCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5 },
    dutyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    dutyDot: { width: 8, height: 8, borderRadius: 4 },
    dutyLabel: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14.5, color: colors.ink },
    dutySubtitle: { fontSize: 12, color: colors.muted, marginTop: 3 },
    activeCard: { borderRadius: 13, padding: 16 },
    activeBadge: { fontSize: 10.5, fontWeight: "700", letterSpacing: 1, color: "rgba(255,255,255,0.85)" },
    activeTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: "#FFFFFF", marginTop: 6 },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: { flex: 1, alignItems: "center", paddingVertical: 14 },
    statValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 17, color: colors.ink },
    statLabel: { fontSize: 10.5, color: colors.muted, marginTop: 4, textAlign: "center" },
    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
    seeAll: { fontSize: 12, fontWeight: "700" },
    jobCard: { gap: 4 },
    jobPrice: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    jobMeta: { fontSize: 11.5, color: colors.muted },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const accent = roleAccents[role];
  const queryClient = useQueryClient();

  const { data: professionalProfile } = useQuery({
    queryKey: ["professionalProfile", userId],
    queryFn: () => fetchProfessionalProfile(userId as string),
    enabled: Boolean(userId),
  });
  const { data: activeJob } = useQuery({
    queryKey: ["activeJob", userId],
    queryFn: () => fetchActiveJob(userId as string),
    enabled: Boolean(userId),
  });
  const { data: availableJobs } = useQuery({
    queryKey: ["availableJobs", role],
    queryFn: () => fetchAvailableJobs(role),
    enabled: Boolean(professionalProfile?.is_on_duty) && !activeJob,
  });

  useEffect(() => {
    const channel = subscribeToAvailableJobs(() => {
      queryClient.invalidateQueries({ queryKey: ["availableJobs", role] });
    });
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient, role]);

  const isOnDuty = professionalProfile?.is_on_duty ?? false;

  async function toggleDuty() {
    if (!userId) return;
    await setOnDuty(userId, !isOnDuty);
    void queryClient.invalidateQueries({ queryKey: ["professionalProfile", userId] });
  }

  return (
    <View style={styles.container}>
      <Card style={[styles.dutyCard, { borderColor: isOnDuty ? accent : colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.dutyRow}>
            <View style={[styles.dutyDot, { backgroundColor: isOnDuty ? accent : colors.muted }]} />
            <Text style={styles.dutyLabel}>{isOnDuty ? "On duty" : "Off duty"}</Text>
          </View>
          <Text style={styles.dutySubtitle}>
            {isOnDuty ? "Ready for your next visit" : "Go on duty to receive jobs"}
          </Text>
        </View>
        <Switch value={isOnDuty} onValueChange={() => void toggleDuty()} trackColor={{ true: accent, false: colors.border }} />
      </Card>

      {activeJob ? (
        <Pressable style={[styles.activeCard, { backgroundColor: accent }]} onPress={() => router.push("/(tabs)/jobs")}>
          <Text style={styles.activeBadge}>ACTIVE VISIT</Text>
          <Text style={styles.activeTitle}>Continue visit →</Text>
        </Pressable>
      ) : null}

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{availableJobs?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Jobs open</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <IndianRupee size={14} color={colors.ink} />
            <Text style={styles.statValue}>0</Text>
          </View>
          <Text style={styles.statLabel}>Earned today</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Star size={13} color="#F4A23B" fill="#F4A23B" />
            <Text style={styles.statValue}>{professionalProfile?.rating.toFixed(1) ?? "—"}</Text>
          </View>
          <Text style={styles.statLabel}>Rating</Text>
        </Card>
      </View>

      {isOnDuty && !activeJob ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Available jobs</Text>
            <Pressable onPress={() => router.push("/(tabs)/jobs")}>
              <Text style={[styles.seeAll, { color: accent }]}>See all</Text>
            </Pressable>
          </View>
          {availableJobs === undefined ? (
            <Skeleton height={80} borderRadius={13} />
          ) : availableJobs.length === 0 ? (
            <EmptyState
              icon={<MapPin size={26} color={accent} strokeWidth={1.6} />}
              title="No jobs available right now"
              body="New jobs in your service area will show up here."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {availableJobs.slice(0, 3).map((job) => (
                <Card key={job.id} style={styles.jobCard}>
                  <Text style={styles.jobPrice}>₹{job.price}</Text>
                  <Text style={styles.jobMeta}>Scheduled {new Date(job.scheduled_at).toLocaleString()}</Text>
                </Card>
              ))}
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}
