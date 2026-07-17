import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, LifeBuoy } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchMyChannels, fetchOrCreateOpsChannel, useSessionStore } from "@curalink/api-client";
import { EmptyState, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function TeamChatScreen() {
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
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink },
    opsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    opsIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#E8F5F0", alignItems: "center", justifyContent: "center" },
    opsTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 13.5, color: colors.ink },
    opsSubtitle: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    channelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    channelLabel: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const { data: channels } = useQuery({
    queryKey: ["myChannels", userId],
    queryFn: () => fetchMyChannels(userId as string),
    enabled: Boolean(userId),
  });

  const careTeamChannels = channels?.filter((c) => c.channel.type === "care_team") ?? [];

  async function openOpsChat() {
    if (!userId) return;
    const channel = await fetchOrCreateOpsChannel(userId);
    router.push(`/chat/${channel.id}`);
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
        <Text style={styles.title}>Team chat</Text>
      </View>

      <Pressable style={styles.opsRow} onPress={() => void openOpsChat()}>
        <View style={styles.opsIcon}>
          <LifeBuoy size={18} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.opsTitle}>Ops support chat</Text>
          <Text style={styles.opsSubtitle}>Message CuraLink ops for help</Text>
        </View>
      </Pressable>

      <Text style={styles.sectionTitle}>Per-visit care team channels</Text>
      {channels === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : careTeamChannels.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={26} color={colors.primary} strokeWidth={1.6} />}
          title="No care-team channels yet"
          body="Opening “Message care team” from an accepted job creates one automatically."
        />
      ) : (
        <View style={{ gap: 8 }}>
          {careTeamChannels.map(({ channel, label }) => (
            <Pressable key={channel.id} style={styles.channelRow} onPress={() => router.push(`/chat/${channel.id}`)}>
              <MessageCircle size={16} color={colors.primary} strokeWidth={1.8} />
              <Text style={styles.channelLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
