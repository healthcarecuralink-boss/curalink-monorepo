import { useEffect, useRef, useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchMessages, sendMessage, subscribeToChannelMessages, useSessionStore } from "@curalink/api-client";
import { Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function ChatRoomScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
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
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 18, color: colors.ink },
    messages: { flex: 1 },
    messagesContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
    bubbleRow: { flexDirection: "row" },
    bubbleRowMine: { justifyContent: "flex-end" },
    bubble: { maxWidth: "78%", borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9 },
    bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    bubbleMine: { backgroundColor: colors.primary },
    bubbleText: { fontSize: 13.5, color: colors.ink },
    bubbleTextMine: { color: "#FFFFFF" },
    bubbleTime: { fontSize: 10.5, color: colors.muted, marginTop: 3, textAlign: "right" },
    bubbleTimeMine: { color: "rgba(255,255,255,0.75)" },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      maxHeight: 100,
      fontSize: 13.5,
      color: colors.ink,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
        }),
      [colors],
    );
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: messages } = useQuery({
    queryKey: ["chatMessages", channelId],
    queryFn: () => fetchMessages(channelId),
    enabled: Boolean(channelId),
  });

  useEffect(() => {
    if (!channelId) return;
    const realtimeChannel = subscribeToChannelMessages(channelId, (message) => {
      queryClient.setQueryData(["chatMessages", channelId], (prev: typeof messages) => {
        if (!prev) return [message];
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });
    return () => {
      void realtimeChannel.unsubscribe();
    };
  }, [channelId, queryClient]);

  async function handleSend() {
    if (!userId || !draft.trim()) return;
    setIsSending(true);
    const body = draft.trim();
    setDraft("");
    try {
      await sendMessage(channelId, userId, body);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Chat</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages === undefined ? (
          <Skeleton height={60} borderRadius={13} />
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === userId;
            return (
              <View key={message.id} style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.body}</Text>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                    {new Date(message.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={colors.muted}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable style={styles.sendButton} disabled={isSending || !draft.trim()} onPress={() => void handleSend()}>
          <Send size={18} color="#FFFFFF" strokeWidth={1.8} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
