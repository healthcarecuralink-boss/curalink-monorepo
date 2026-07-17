import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquareText, Stethoscope } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  createSecondOpinionRequest,
  fetchFamilyMembers,
  fetchMySecondOpinionRequests,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, StatusPill, TextField, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";

const statusPill = (status: string) => {
  switch (status) {
    case "open":
      return curalinkStatusPillColors.pending;
    case "claimed":
      return curalinkStatusPillColors.confirmed;
    default:
      return curalinkStatusPillColors.completed;
  }
};

export default function SecondOpinionScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
        header: { flexDirection: "row", alignItems: "center", gap: 12 },
        backButton: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { fontFamily: curalinkFonts.heading, fontSize: 19, color: colors.ink },
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
        fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted, marginBottom: 8 },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        chipSelected: { backgroundColor: colors.successTint, borderColor: colors.primary },
        chipText: { fontSize: 12.5, fontWeight: "600", color: colors.muted },
        chipTextSelected: { color: colors.primaryPress },
        requestRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
        requestQuestion: { fontSize: 13, fontWeight: "600", color: colors.ink },
        requestMeta: { fontSize: 11, color: colors.muted2, marginTop: 2 },
        requestResponse: { fontSize: 12.5, color: colors.ink2, marginTop: 6, lineHeight: 18 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();

  const [patientId, setPatientId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: familyMembers } = useQuery({
    queryKey: ["familyMembers", profileId],
    queryFn: () => fetchFamilyMembers(profileId as string),
    enabled: Boolean(profileId),
  });
  const { data: requests } = useQuery({
    queryKey: ["mySecondOpinionRequests", profileId],
    queryFn: () => fetchMySecondOpinionRequests(profileId as string),
    enabled: Boolean(profileId),
  });

  async function handleSubmit() {
    if (!profileId || !question.trim()) return;
    setIsSubmitting(true);
    try {
      await createSecondOpinionRequest({ consumer_id: profileId, patient_id: patientId, question });
      setQuestion("");
      setPatientId(null);
      void queryClient.invalidateQueries({ queryKey: ["mySecondOpinionRequests", profileId] });
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <Text style={styles.title}>Second opinion</Text>
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Ask a doctor</Text>
        {familyMembers && familyMembers.length > 0 ? (
          <>
            <Text style={styles.fieldLabel}>Who is this about? (optional)</Text>
            <View style={styles.chipRow}>
              {familyMembers.map((member) => (
                <Pressable
                  key={member.id}
                  style={[styles.chip, patientId === member.id && styles.chipSelected]}
                  onPress={() => setPatientId(patientId === member.id ? null : member.id)}
                >
                  <Text style={[styles.chipText, patientId === member.id && styles.chipTextSelected]}>{member.full_name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        <TextField
          label="Your question"
          placeholder="Describe the diagnosis or treatment you'd like a second opinion on..."
          multiline
          value={question}
          onChangeText={setQuestion}
        />
        <Button label={isSubmitting ? "Sending..." : "Send request"} disabled={!question.trim() || isSubmitting} onPress={() => void handleSubmit()} />
      </Card>

      <Text style={styles.sectionTitle}>Your requests</Text>
      {requests === undefined ? (
        <Skeleton height={70} borderRadius={16} />
      ) : requests.length === 0 ? (
        <EmptyState icon={<Stethoscope size={26} color={colors.primary} strokeWidth={1.6} />} title="No requests yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {requests.map((request) => (
            <Card key={request.id} style={styles.requestRow}>
              <MessageSquareText size={18} color={colors.primary} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={styles.requestQuestion}>{request.question}</Text>
                <Text style={styles.requestMeta}>{new Date(request.created_at).toLocaleDateString("en-IN")}</Text>
                {request.response ? <Text style={styles.requestResponse}>{request.response}</Text> : null}
              </View>
              <StatusPill label={request.status} {...statusPill(request.status)} />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
