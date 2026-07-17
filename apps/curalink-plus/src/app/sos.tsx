import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PhoneCall, ShieldAlert } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fetchActiveJob, fetchOrCreateEscalationChannel, sendMessage, useSessionStore } from "@curalink/api-client";
import { Button, curalinkPlusFonts, useTheme } from "@curalink/ui";

export default function SosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60 },
        header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
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
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 19, color: colors.ink },
        centerArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 },
        iconRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#FCE8E8", alignItems: "center", justifyContent: "center" },
        body: { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 19, maxWidth: 280 },
        sentText: { fontSize: 14, fontWeight: "700", color: colors.primary, textAlign: "center" },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: activeJob } = useQuery({
    queryKey: ["activeJob", userId],
    queryFn: () => fetchActiveJob(userId as string),
    enabled: Boolean(userId),
  });

  async function handleTrigger() {
    if (!userId) return;
    setIsSending(true);
    try {
      const channel = await fetchOrCreateEscalationChannel(userId, activeJob?.id ?? null);
      await sendMessage(channel.id, userId, "SOS: I need immediate assistance.");
      setSent(true);
      setTimeout(() => router.replace(`/chat/${channel.id}`), 1200);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Emergency SOS</Text>
      </View>

      <View style={styles.centerArea}>
        <View style={styles.iconRing}>
          <ShieldAlert size={44} color={colors.error} strokeWidth={1.6} />
        </View>
        {sent ? (
          <Text style={styles.sentText}>Alert sent to your admin</Text>
        ) : (
          <>
            <Text style={styles.body}>
              Press and confirm below to alert your team admin immediately{activeJob ? " about your current visit" : ""}. Use this
              only for a genuine safety or medical emergency.
            </Text>
            <Button
              label={isSending ? "Sending alert..." : "Trigger SOS"}
              variant="destructive"
              disabled={isSending}
              onPress={() => void handleTrigger()}
              style={{ minWidth: 200 }}
            />
            <Pressable onPress={() => router.push("/team-chat")}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <PhoneCall size={14} color={colors.muted} />
                <Text style={{ fontSize: 12, color: colors.muted }}>Not an emergency? Message ops instead</Text>
              </View>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
