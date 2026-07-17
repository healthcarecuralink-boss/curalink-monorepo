import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquareText } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  answerSecondOpinionRequest,
  claimSecondOpinionRequest,
  fetchMyClaimedSecondOpinionRequests,
  fetchOpenSecondOpinionRequests,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, StatusPill, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";

export default function SecondOpinionQueueScreen() {
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
        sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
        requestQuestion: { fontSize: 13, fontWeight: "600", color: colors.ink },
        requestMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const doctorId = session?.user.id;
  const queryClient = useQueryClient();
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const { data: openRequests } = useQuery({
    queryKey: ["openSecondOpinionRequests"],
    queryFn: () => fetchOpenSecondOpinionRequests(),
  });
  const { data: claimedRequests } = useQuery({
    queryKey: ["myClaimedSecondOpinionRequests", doctorId],
    queryFn: () => fetchMyClaimedSecondOpinionRequests(doctorId as string),
    enabled: Boolean(doctorId),
  });

  async function handleClaim(id: string) {
    if (!doctorId) return;
    setSubmittingId(id);
    try {
      await claimSecondOpinionRequest(id, doctorId);
      void queryClient.invalidateQueries({ queryKey: ["openSecondOpinionRequests"] });
      void queryClient.invalidateQueries({ queryKey: ["myClaimedSecondOpinionRequests", doctorId] });
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleAnswer(id: string) {
    const response = responseDrafts[id];
    if (!response?.trim()) return;
    setSubmittingId(id);
    try {
      await answerSecondOpinionRequest(id, response);
      void queryClient.invalidateQueries({ queryKey: ["myClaimedSecondOpinionRequests", doctorId] });
    } finally {
      setSubmittingId(null);
    }
  }

  const pendingClaimed = (claimedRequests ?? []).filter((r) => r.status === "claimed");
  const answered = (claimedRequests ?? []).filter((r) => r.status === "answered");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.title}>Second opinion requests</Text>
      </View>

      <Text style={styles.sectionTitle}>Open requests</Text>
      {openRequests === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : openRequests.length === 0 ? (
        <EmptyState icon={<MessageSquareText size={26} color={colors.primary} strokeWidth={1.6} />} title="No open requests" />
      ) : (
        <View style={{ gap: 8 }}>
          {openRequests.map((request) => (
            <Card key={request.id} style={{ gap: 8 }}>
              <Text style={styles.requestQuestion}>{request.question}</Text>
              <Text style={styles.requestMeta}>{new Date(request.created_at).toLocaleDateString("en-IN")}</Text>
              <Button label={submittingId === request.id ? "Claiming..." : "Claim"} disabled={submittingId !== null} onPress={() => void handleClaim(request.id)} />
            </Card>
          ))}
        </View>
      )}

      {pendingClaimed.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Awaiting your answer</Text>
          <View style={{ gap: 8 }}>
            {pendingClaimed.map((request) => (
              <Card key={request.id} style={{ gap: 8 }}>
                <Text style={styles.requestQuestion}>{request.question}</Text>
                <TextField
                  placeholder="Write your opinion..."
                  multiline
                  value={responseDrafts[request.id] ?? ""}
                  onChangeText={(v) => setResponseDrafts((prev) => ({ ...prev, [request.id]: v }))}
                />
                <Button
                  label={submittingId === request.id ? "Sending..." : "Send answer"}
                  disabled={submittingId !== null || !responseDrafts[request.id]?.trim()}
                  onPress={() => void handleAnswer(request.id)}
                />
              </Card>
            ))}
          </View>
        </>
      ) : null}

      {answered.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Answered</Text>
          <View style={{ gap: 8 }}>
            {answered.map((request) => (
              <Card key={request.id} style={{ gap: 6 }}>
                <Text style={styles.requestQuestion}>{request.question}</Text>
                <StatusPill label="answered" fg={colors.primary} bg="#E8F5F0" />
              </Card>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
