import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Siren } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchAmbulanceRequestHistory,
  fetchIncomingAmbulanceRequests,
  fetchActiveAmbulanceJob,
  useSessionStore,
} from "@curalink/api-client";
import { EmptyState, Skeleton, StatusPill, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";


const tabs = ["available", "accepted", "history"] as const;
type Tab = (typeof tabs)[number];

const statusColors: Record<string, { fg: string; bg: string }> = {
  requested: { fg: "#B45309", bg: "#FEF3E2" },
  accepted: { fg: "#1D4ED8", bg: "#EAF1FE" },
  en_route: { fg: "#1D4ED8", bg: "#EAF1FE" },
  arrived: { fg: "#1D4ED8", bg: "#EAF1FE" },
  transporting: { fg: "#0B5A45", bg: "#E8F5F0" },
  completed: { fg: "#0B5A45", bg: "#E8F5F0" },
  cancelled: { fg: "#64748B", bg: "#EEF1F4" },
};

export default function RequestsScreen() {
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
    requestCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    requestTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    requestMeta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
        }),
      [colors],
    );
  const [tab, setTab] = useState<Tab>("available");
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const accent = roleAccents.ambulance;

  const { data: available } = useQuery({
    queryKey: ["incomingAmbulanceRequests"],
    queryFn: () => fetchIncomingAmbulanceRequests(),
    enabled: tab === "available",
  });
  const { data: active } = useQuery({
    queryKey: ["activeAmbulanceJob", userId],
    queryFn: () => fetchActiveAmbulanceJob(userId as string),
    enabled: Boolean(userId) && tab === "accepted",
  });
  const { data: history } = useQuery({
    queryKey: ["ambulanceRequestHistory", userId],
    queryFn: () => fetchAmbulanceRequestHistory(userId as string),
    enabled: Boolean(userId) && tab === "history",
  });

  const listForTab = tab === "available" ? available : tab === "accepted" ? (active ? [active] : []) : history;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Emergency requests</Text>

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

      {listForTab === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : listForTab.length === 0 ? (
        <EmptyState icon={<Siren size={26} color={accent} strokeWidth={1.6} />} title={`No ${tab} requests`} />
      ) : (
        <View style={{ gap: 10 }}>
          {listForTab.map((request) => (
            <Pressable key={request.id} style={styles.requestCard} onPress={() => router.push(`/requests/${request.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestTitle}>
                  {request.type} · {request.patient_init ?? "Patient"}
                </Text>
                <Text style={styles.requestMeta}>{request.reason ?? new Date(request.created_at).toLocaleString("en-IN")}</Text>
              </View>
              <StatusPill
                label={request.status.replace("_", " ")}
                {...(statusColors[request.status] ?? { fg: colors.muted, bg: colors.border })}
              />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
