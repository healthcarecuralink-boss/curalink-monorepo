import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, MessageCircle } from "lucide-react-native";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  acceptJob,
  completeVisit,
  fetchJobDetail,
  toWhatsAppLink,
  updateBookingStatus,
  updateVisitFields,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, Skeleton, StatusPill, TextField, curalinkPlusFonts, useTheme, type ThemeContextValue } from "@curalink/ui";

const statusColors: Record<string, { fg: string; bg: string }> = {
  pending: { fg: "#B45309", bg: "#FEF3E2" },
  confirmed: { fg: "#1D4ED8", bg: "#EAF1FE" },
  en_route: { fg: "#1D4ED8", bg: "#EAF1FE" },
  in_progress: { fg: "#0B5A45", bg: "#E8F5F0" },
  completed: { fg: "#0B5A45", bg: "#E8F5F0" },
  cancelled: { fg: "#64748B", bg: "#EEF1F4" },
};

function Row({ label, value, colors }: { label: string; value: string; colors: ThemeContextValue["colors"] }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 12.5, color: colors.ink, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 12 }}>{value}</Text>
    </View>
  );
}

export default function ConsultDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 14 },
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
        title: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 16, color: colors.ink },
        subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
        sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
      }),
    [colors],
  );

  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionStore((s) => s.session);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: detail } = useQuery({
    queryKey: ["jobDetail", id],
    queryFn: () => fetchJobDetail(id),
    enabled: Boolean(id),
  });

  async function handleAccept() {
    const userId = session?.user.id;
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await acceptJob(id, userId);
      void queryClient.invalidateQueries({ queryKey: ["jobDetail", id] });
      void queryClient.invalidateQueries({ queryKey: ["availableJobs", "doctor"] });
      void queryClient.invalidateQueries({ queryKey: ["activeJob"] });
    } finally {
      setIsSubmitting(false);
    }
  }

  // No in-app video (needs a WebRTC provider that isn't set up) -- the
  // consult happens over WhatsApp instead, so "starting" the consult just
  // means moving the booking to in_progress and handing off to WhatsApp.
  async function handleStartConsult(consumerPhone: string) {
    setIsSubmitting(true);
    try {
      await updateBookingStatus(id, "in_progress");
      void queryClient.invalidateQueries({ queryKey: ["jobDetail", id] });
      void Linking.openURL(toWhatsAppLink(consumerPhone, "Hi, this is your doctor from CuraLink. Ready when you are."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinueOnWhatsApp(consumerPhone: string) {
    void Linking.openURL(toWhatsAppLink(consumerPhone));
  }

  async function handleSaveNotes() {
    setIsSubmitting(true);
    try {
      await updateVisitFields(id, { notes });
      void queryClient.invalidateQueries({ queryKey: ["jobDetail", id] });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      if (notes.trim()) {
        await updateVisitFields(id, { notes });
      }
      await completeVisit(id, "");
      router.replace("/(tabs)/queue");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={13} />
      </View>
    );
  }

  const { booking, serviceName, patientName, consumerPhone } = detail;

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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{serviceName}</Text>
          {patientName ? <Text style={styles.subtitle}>for {patientName}</Text> : null}
        </View>
        <StatusPill
          label={booking.status.replace("_", " ")}
          {...(statusColors[booking.status] ?? { fg: colors.muted, bg: colors.border })}
        />
      </View>

      <Card>
        <Row label="Scheduled" value={new Date(booking.scheduled_at).toLocaleString("en-IN")} colors={colors} />
        <Row label="Price" value={`₹${booking.price}`} colors={colors} />
      </Card>

      {booking.status === "pending" ? (
        <Button label={isSubmitting ? "Accepting..." : "Accept consult"} disabled={isSubmitting} onPress={() => void handleAccept()} />
      ) : null}

      {booking.status === "confirmed" && consumerPhone ? (
        <Button
          label={isSubmitting ? "Starting..." : "Message patient on WhatsApp to start"}
          icon={<MessageCircle size={16} color="#FFFFFF" />}
          disabled={isSubmitting}
          onPress={() => void handleStartConsult(consumerPhone)}
        />
      ) : null}

      {booking.status === "in_progress" ? (
        <Card style={{ gap: 12 }}>
          {consumerPhone ? (
            <Button
              label="Continue on WhatsApp"
              variant="secondary"
              icon={<MessageCircle size={16} color={colors.ink} />}
              onPress={() => handleContinueOnWhatsApp(consumerPhone)}
            />
          ) : null}

          <Text style={styles.sectionTitle}>Consult notes</Text>
          <TextField placeholder="Diagnosis, advice given..." multiline value={notes || booking.notes || ""} onChangeText={setNotes} />
          <Button label="Save notes" variant="secondary" disabled={isSubmitting} onPress={() => void handleSaveNotes()} />

          {booking.patient_id ? (
            <Button
              label="Write prescription"
              variant="secondary"
              icon={<FileText size={16} color={colors.ink} />}
              onPress={() =>
                router.push({
                  pathname: "/prescriptions/write",
                  params: { patientId: booking.patient_id as string, bookingId: id },
                })
              }
            />
          ) : null}

          <Button label={isSubmitting ? "Completing..." : "Complete consult"} disabled={isSubmitting} onPress={() => void handleComplete()} />
        </Card>
      ) : null}
    </ScrollView>
  );
}
