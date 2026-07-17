import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ArrowLeft, MessageCircle, Siren, Tag } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { fetchNotificationPreferences, updateNotificationPreferences, useSessionStore } from "@curalink/api-client";
import { Card, curalinkPlusFonts, useTheme } from "@curalink/ui";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";

const rows = [
  { key: "visit_updates" as const, label: "Job updates", description: "New jobs, status changes, reassignments", Icon: Bell },
  { key: "chat_messages" as const, label: "Messages", description: "Team chat and ops support", Icon: MessageCircle },
  { key: "emergency_alerts" as const, label: "Emergency alerts", description: "SOS and dispatch alerts", Icon: Siren },
  { key: "promotions" as const, label: "Announcements", description: "Payout updates and platform news", Icon: Tag },
];

export default function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
        header: { flexDirection: "row", alignItems: "center", gap: 12 },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink },
        row: { flexDirection: "row", alignItems: "center", gap: 12 },
        rowLabel: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
        rowNote: { fontSize: 11, color: colors.muted, marginTop: 2 },
        pushRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.primary },
        pushLabel: { fontSize: 13.5, fontWeight: "700", color: "#FFFFFF" },
        pushNote: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const { data: prefs } = useQuery({
    queryKey: ["notificationPreferences", profileId],
    queryFn: () => fetchNotificationPreferences(profileId as string),
    enabled: Boolean(profileId),
  });

  async function handleEnablePush() {
    if (!profileId) return;
    setIsRegistering(true);
    try {
      const token = await registerForPushNotificationsAsync(profileId);
      setPushEnabled(Boolean(token));
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleToggle(key: (typeof rows)[number]["key"], value: boolean) {
    if (!profileId) return;
    await updateNotificationPreferences(profileId, { [key]: value });
    void queryClient.invalidateQueries({ queryKey: ["notificationPreferences", profileId] });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <Pressable onPress={() => void handleEnablePush()} disabled={isRegistering || pushEnabled}>
        <Card style={styles.pushRow}>
          <Bell size={20} color="#FFFFFF" strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pushLabel}>{pushEnabled ? "Push notifications enabled" : "Enable push notifications"}</Text>
            <Text style={styles.pushNote}>
              {isRegistering ? "Requesting permission..." : "On web this needs the mobile app — device push isn't set up in a browser"}
            </Text>
          </View>
        </Card>
      </Pressable>

      {rows.map((row) => (
        <Card key={row.key} style={styles.row}>
          <row.Icon size={18} color={colors.muted} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowNote}>{row.description}</Text>
          </View>
          <Switch
            value={prefs?.[row.key] ?? true}
            onValueChange={(value) => void handleToggle(row.key, value)}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel={`Toggle ${row.label} notifications`}
          />
        </Card>
      ))}
    </ScrollView>
  );
}
