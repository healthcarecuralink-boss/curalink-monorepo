import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Activity, Check, Home, Repeat, Stethoscope } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createEnrollment, fetchMyEnrollments, useSessionStore } from "@curalink/api-client";
import { Button, Card, StatusPill, TextField, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";

const programs = [
  { key: "chronic_care" as const, label: "Chronic care programs", description: "Ongoing management for diabetes, hypertension & more", Icon: Repeat },
  { key: "checkup_package" as const, label: "Checkup packages", description: "Bundled full-body and preventive health checkups", Icon: Stethoscope },
  { key: "home_nursing" as const, label: "Home nursing subscription", description: "Recurring nurse visits at a discounted rate", Icon: Activity },
  { key: "home_icu" as const, label: "Home ICU setup", description: "Critical care equipment & staffing at home", Icon: Home },
];

const enrollmentStatusPill = (status: string) => {
  switch (status) {
    case "requested":
      return curalinkStatusPillColors.pending;
    case "contacted":
      return curalinkStatusPillColors.confirmed;
    case "active":
      return curalinkStatusPillColors.completed;
    default:
      return curalinkStatusPillColors.cancelled;
  }
};

export default function CareProgramsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 12 },
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
        title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
        programCard: { gap: 10 },
        programRow: { flexDirection: "row", alignItems: "center", gap: 12 },
        iconChip: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#E9FBF3", alignItems: "center", justifyContent: "center" },
        programName: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
        programDescription: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: colors.ink, marginTop: 8 },
        requestRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        requestName: { fontSize: 13, fontWeight: "700", color: colors.ink },
        requestMeta: { fontSize: 11, color: colors.muted2, marginTop: 2 },
        requestedNote: { flexDirection: "row", alignItems: "center", gap: 6 },
        requestedText: { fontSize: 12, fontWeight: "600", color: colors.primary },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: enrollments } = useQuery({
    queryKey: ["myEnrollments", profileId],
    queryFn: () => fetchMyEnrollments(profileId as string),
    enabled: Boolean(profileId),
  });

  const programLabel = (key: string) => programs.find((p) => p.key === key)?.label ?? key;
  const alreadyRequested = (key: string) => (enrollments ?? []).some((e) => e.program_key === key);

  async function handleSubmit(programKey: (typeof programs)[number]["key"]) {
    if (!profileId) return;
    setIsSubmitting(true);
    try {
      await createEnrollment({ consumer_id: profileId, program_key: programKey, notes: notes || null });
      setExpandedProgram(null);
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["myEnrollments", profileId] });
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
        <Text style={styles.title}>Care programs</Text>
      </View>

      {programs.map((program) => {
        const requested = alreadyRequested(program.key);
        return (
          <Card key={program.key} style={styles.programCard}>
            <View style={styles.programRow}>
              <View style={styles.iconChip}>
                <program.Icon size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.programName}>{program.label}</Text>
                <Text style={styles.programDescription}>{program.description}</Text>
              </View>
            </View>

            {requested ? (
              <View style={styles.requestedNote}>
                <Check size={14} color={colors.primary} />
                <Text style={styles.requestedText}>Request sent — our team will reach out</Text>
              </View>
            ) : expandedProgram === program.key ? (
              <View style={{ gap: 10 }}>
                <TextField
                  placeholder="Anything specific we should know? (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
                <Button
                  label={isSubmitting ? "Sending..." : "Send request"}
                  disabled={isSubmitting}
                  onPress={() => void handleSubmit(program.key)}
                />
              </View>
            ) : (
              <Button label="Request info" variant="secondary" onPress={() => setExpandedProgram(program.key)} />
            )}
          </Card>
        );
      })}

      {enrollments && enrollments.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Your requests</Text>
          <View style={{ gap: 8 }}>
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} style={styles.requestRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestName}>{programLabel(enrollment.program_key)}</Text>
                  <Text style={styles.requestMeta}>{new Date(enrollment.created_at).toLocaleDateString("en-IN")}</Text>
                </View>
                <StatusPill label={enrollment.status} {...enrollmentStatusPill(enrollment.status)} />
              </Card>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
