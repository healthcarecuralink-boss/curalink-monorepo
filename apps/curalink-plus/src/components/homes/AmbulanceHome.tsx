import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChevronRight, Gauge, Route, Siren, Truck } from "lucide-react-native";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import {
  fetchIncomingAmbulanceRequests,
  fetchProfessionalProfile,
  setOnDuty,
  subscribeToIncomingAmbulanceRequests,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";

const accent = roleAccents.ambulance;

export function AmbulanceHome() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { gap: 14 },
    vehicleLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    vehicleLinkLabel: { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.ink },
    statusCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14.5, color: colors.ink },
    statusSubtitle: { fontSize: 12, color: colors.muted, marginTop: 3 },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
    statValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 17, color: colors.ink },
    statLabel: { fontSize: 10.5, color: colors.muted, textAlign: "center" },
    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
    seeAll: { fontSize: 12, fontWeight: "700" },
    requestCard: { gap: 4 },
    requestTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    requestMeta: { fontSize: 11.5, color: colors.muted },
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
  const { data: requests } = useQuery({
    queryKey: ["incomingAmbulanceRequests"],
    queryFn: () => fetchIncomingAmbulanceRequests(),
    enabled: Boolean(professionalProfile?.is_on_duty),
  });

  useEffect(() => {
    const channel = subscribeToIncomingAmbulanceRequests(() => {
      queryClient.invalidateQueries({ queryKey: ["incomingAmbulanceRequests"] });
    });
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const isOnDuty = professionalProfile?.is_on_duty ?? false;

  async function toggleDuty() {
    if (!userId) return;
    await setOnDuty(userId, !isOnDuty);
    void queryClient.invalidateQueries({ queryKey: ["professionalProfile", userId] });
  }

  return (
    <View style={styles.container}>
      <Card style={[styles.statusCard, { borderColor: isOnDuty ? accent : colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnDuty ? accent : colors.muted }]} />
            <Text style={styles.statusLabel}>{isOnDuty ? "On duty" : "Off duty"}</Text>
          </View>
          <Text style={styles.statusSubtitle}>
            {isOnDuty ? "Ready to receive emergency requests" : "You won't receive requests"}
          </Text>
        </View>
        <Switch value={isOnDuty} onValueChange={() => void toggleDuty()} trackColor={{ true: accent, false: colors.border }} />
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{requests?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Trips today</Text>
        </Card>
        <Card style={styles.statCard}>
          <Route size={16} color={colors.ink} />
          <Text style={styles.statLabel}>Distance</Text>
        </Card>
        <Card style={styles.statCard}>
          <Gauge size={16} color={colors.ink} />
          <Text style={styles.statLabel}>Avg response</Text>
        </Card>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Emergency requests</Text>
        <Text style={[styles.seeAll, { color: accent }]} onPress={() => router.push("/(tabs)/requests")}>
          See all
        </Text>
      </View>
      {requests === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Siren size={26} color={accent} strokeWidth={1.6} />}
          title="No active requests"
          body="Emergency transport requests near you will show up here."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {requests.slice(0, 3).map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <Text style={styles.requestTitle}>
                {request.type} · {request.patient_init}
              </Text>
              <Text style={styles.requestMeta}>{request.reason}</Text>
            </Card>
          ))}
        </View>
      )}

      <Pressable style={styles.vehicleLink} onPress={() => router.push("/vehicle-crew")}>
        <Truck size={18} color={accent} strokeWidth={1.8} />
        <Text style={styles.vehicleLinkLabel}>Vehicle & crew</Text>
        <ChevronRight size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
}
