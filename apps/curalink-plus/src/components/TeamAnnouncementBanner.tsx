import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fetchMyTeamId, fetchTeamAnnouncements, useSessionStore } from "@curalink/api-client";
import { curalinkPlusFonts, useTheme } from "@curalink/ui";

// Shows the most recent message a team's admin has broadcast, on every
// non-admin role home screen. Dismissal is local/session-only (no "read"
// tracking table yet) -- the real notification already landed in the
// recipient's notification center via send_team_announcement's fan-out.
export function TeamAnnouncementBanner() {
  const { colors } = useTheme();
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 13,
          padding: 12,
        },
        icon: { marginTop: 1 },
        label: { fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
        message: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 13, color: colors.ink, marginTop: 2 },
      }),
    [colors],
  );

  const { data: teamId } = useQuery({
    queryKey: ["myTeamId", userId],
    queryFn: () => fetchMyTeamId(userId as string),
    enabled: Boolean(userId),
  });
  const { data: announcements } = useQuery({
    queryKey: ["teamAnnouncements", teamId],
    queryFn: () => fetchTeamAnnouncements(teamId as string),
    enabled: Boolean(teamId),
  });

  const latest = announcements?.[0];
  if (!latest || latest.id === dismissedId) return null;

  return (
    <View style={styles.banner}>
      <Megaphone size={18} color={colors.primary} strokeWidth={1.8} style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>From your team admin</Text>
        <Text style={styles.message}>{latest.message}</Text>
      </View>
      <Pressable hitSlop={8} onPress={() => setDismissedId(latest.id)} accessibilityRole="button" accessibilityLabel="Dismiss">
        <X size={16} color={colors.muted} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
