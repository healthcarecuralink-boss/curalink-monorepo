import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircleHeart, Send } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  fetchAssistantMessages,
  fetchOrCreateAssistantConversation,
  sendAssistantMessage,
  subscribeToAssistantMessages,
  useSessionStore,
} from "@curalink/api-client";
import { Skeleton, curalinkFonts, useTheme } from "@curalink/ui";

const quickPrompts = ["Book a nurse visit", "Track my pharmacy order", "Show my prescriptions", "When should I call an ambulance?"];

export default function CuraAssistantScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 70, paddingHorizontal: 20, paddingBottom: 12 },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { fontFamily: curalinkFonts.heading, fontSize: 18, color: colors.ink },
        subtitle: { fontSize: 11, color: colors.muted2 },
        promptsRow: { paddingHorizontal: 20, paddingBottom: 10, gap: 8, flexDirection: "row", flexWrap: "wrap" },
        promptChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        promptChipText: { fontSize: 12, fontWeight: "600", color: colors.primary },
        messages: { flex: 1 },
        messagesContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
        bubbleRow: { flexDirection: "row" },
        bubbleRowMine: { justifyContent: "flex-end" },
        bubble: { maxWidth: "82%", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
        bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2 },
        bubbleMine: { backgroundColor: colors.primary },
        bubbleText: { fontSize: 13.5, color: colors.ink, lineHeight: 19 },
        bubbleTextMine: { color: "#FFFFFF" },
        emptyState: { alignItems: "center", paddingTop: 40, paddingHorizontal: 30, gap: 10 },
        emptyIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: "#E9FBF3", alignItems: "center", justifyContent: "center" },
        emptyTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: colors.ink, textAlign: "center" },
        emptyBody: { fontSize: 12.5, color: colors.muted2, textAlign: "center", lineHeight: 18 },
        typingBubble: { flexDirection: "row", gap: 4 },
        typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted2 },
        composer: {
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border2,
        },
        input: {
          flex: 1,
          maxHeight: 100,
          fontSize: 13.5,
          color: colors.ink,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border2,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
        },
        sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: conversation } = useQuery({
    queryKey: ["assistantConversation", profileId],
    queryFn: () => fetchOrCreateAssistantConversation(profileId as string),
    enabled: Boolean(profileId),
  });
  const conversationId = conversation?.id;

  const { data: messages } = useQuery({
    queryKey: ["assistantMessages", conversationId],
    queryFn: () => fetchAssistantMessages(conversationId as string),
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId) return;
    const realtimeChannel = subscribeToAssistantMessages(conversationId, (message) => {
      queryClient.setQueryData(["assistantMessages", conversationId], (prev: typeof messages) => {
        if (!prev) return [message];
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.role === "assistant") setIsSending(false);
    });
    return () => {
      void realtimeChannel.unsubscribe();
    };
  }, [conversationId, queryClient]);

  async function handleSend(text: string) {
    if (!conversationId || !text.trim() || isSending) return;
    setIsSending(true);
    setDraft("");
    try {
      await sendAssistantMessage(conversationId, text.trim());
    } catch {
      setIsSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text style={styles.title}>Cura Assistant</Text>
          <Text style={styles.subtitle}>Ask about bookings, orders, or your health</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages === undefined ? (
          <Skeleton height={60} borderRadius={16} />
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MessageCircleHeart size={26} color={colors.primary} strokeWidth={1.6} />
            </View>
            <Text style={styles.emptyTitle}>Hi, I&apos;m Cura</Text>
            <Text style={styles.emptyBody}>
              Ask me to help book a visit, track an order, or answer a quick health question — try one of the prompts below.
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const isMine = message.role === "user";
            return (
              <View key={message.id} style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.content}</Text>
                </View>
              </View>
            );
          })
        )}
        {isSending ? (
          <View style={styles.bubbleRow}>
            <View style={[styles.bubble, styles.bubbleTheirs, styles.typingBubble]}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.promptsRow}>
        {quickPrompts.map((prompt) => (
          <Pressable key={prompt} style={styles.promptChip} onPress={() => void handleSend(prompt)} disabled={isSending}>
            <Text style={styles.promptChipText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Cura anything..."
          placeholderTextColor={colors.muted}
          value={draft}
          onChangeText={setDraft}
          multiline
          accessibilityLabel="Message Cura Assistant"
        />
        <Pressable
          style={styles.sendButton}
          disabled={isSending || !draft.trim()}
          onPress={() => void handleSend(draft)}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Send size={18} color="#FFFFFF" strokeWidth={1.8} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
