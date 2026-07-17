import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, BellRing } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, useSessionStore } from "@curalink/api-client";
import { EmptyState, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { flex: 1, fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink },
    markAllLabel: { fontSize: 12, fontWeight: "700", color: colors.primary },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    rowUnread: { borderColor: colors.primary },
    iconChip: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: "#E8F5F0",
      alignItems: "center",
      justifyContent: "center",
    },
    notificationTitle: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
    notificationBody: { fontSize: 12, color: colors.ink, marginTop: 2, lineHeight: 17 },
    notificationMeta: { fontSize: 10.5, color: colors.muted, marginTop: 4 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", profileId],
    queryFn: () => fetchNotifications(profileId as string),
    enabled: Boolean(profileId),
  });

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;

  async function handleTap(id: string) {
    await markNotificationRead(id);
    void queryClient.invalidateQueries({ queryKey: ["notifications", profileId] });
  }

  async function handleMarkAllRead() {
    if (!profileId) return;
    await markAllNotificationsRead(profileId);
    void queryClient.invalidateQueries({ queryKey: ["notifications", profileId] });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={() => void handleMarkAllRead()}>
            <Text style={styles.markAllLabel}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {notifications === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell size={26} color={colors.primary} strokeWidth={1.6} />} title="No notifications yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={[styles.row, !notification.read_at && styles.rowUnread]}
              onPress={() => void handleTap(notification.id)}
            >
              <View style={styles.iconChip}>
                <BellRing size={16} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                {notification.body ? <Text style={styles.notificationBody}>{notification.body}</Text> : null}
                <Text style={styles.notificationMeta}>{new Date(notification.created_at).toLocaleString("en-IN")}</Text>
              </View>
              {!notification.read_at ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
