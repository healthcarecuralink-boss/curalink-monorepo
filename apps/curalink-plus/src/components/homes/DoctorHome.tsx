import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChevronRight, FileText, IndianRupee, MessageSquareText, Star, Video } from "lucide-react-native";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { fetchAvailableJobs, fetchProfessionalProfile, setOnDuty, useSessionStore } from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";

const accent = roleAccents.doctor;

export function DoctorHome() {
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
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: { flex: 1, alignItems: "center", paddingVertical: 14 },
    statValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 17, color: colors.ink },
    statLabel: { fontSize: 10.5, color: colors.muted, marginTop: 4, textAlign: "center" },
    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
    seeAll: { fontSize: 12, fontWeight: "700" },
    queueCard: {},
    queuePrice: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    prescriptionsLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    prescriptionsLinkLabel: { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.ink },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const { data: professionalProfile } = useQuery({
    queryKey: ["professionalProfile", userId],
    queryFn: () => fetchProfessionalProfile(userId as string),
    enabled: Boolean(userId),
  });
  const { data: queue } = useQuery({
    queryKey: ["availableJobs", "doctor"],
    queryFn: () => fetchAvailableJobs("doctor"),
    enabled: Boolean(professionalProfile?.is_on_duty),
  });

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
          <Text style={styles.dutySubtitle}>{isOnDuty ? "Ready for teleconsults" : "Go on duty to receive consults"}</Text>
        </View>
        <Switch value={isOnDuty} onValueChange={() => void toggleDuty()} trackColor={{ true: accent, false: colors.border }} />
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{queue?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Consults</Text>
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

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Teleconsult queue</Text>
        <Text style={[styles.seeAll, { color: accent }]} onPress={() => router.push("/(tabs)/queue")}>
          See all
        </Text>
      </View>
      {queue === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={<Video size={26} color={accent} strokeWidth={1.6} />}
          title="No one's waiting"
          body="Patients waiting for a teleconsult will show up here."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {queue.slice(0, 3).map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/consult/${item.id}`)}>
              <Card style={styles.queueCard}>
                <Text style={styles.queuePrice}>₹{item.price}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable style={styles.prescriptionsLink} onPress={() => router.push("/prescriptions/history")}>
        <FileText size={18} color={accent} strokeWidth={1.8} />
        <Text style={styles.prescriptionsLinkLabel}>Prescriptions history</Text>
        <ChevronRight size={16} color={colors.muted} />
      </Pressable>

      <Pressable style={styles.prescriptionsLink} onPress={() => router.push("/second-opinion-queue")}>
        <MessageSquareText size={18} color={accent} strokeWidth={1.8} />
        <Text style={styles.prescriptionsLinkLabel}>Second opinion requests</Text>
        <ChevronRight size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
}
