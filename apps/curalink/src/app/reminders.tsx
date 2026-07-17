import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlarmClock, ArrowLeft, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createReminder, deleteReminder, fetchReminders, fetchUpcomingBookings, useSessionStore } from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, TextField, curalinkFonts, useTheme } from "@curalink/ui";

const presets = [
  { label: "In 1 hour", ms: 60 * 60 * 1000 },
  { label: "In 3 hours", ms: 3 * 60 * 60 * 1000 },
  { label: "Tomorrow morning", ms: null },
  { label: "In 3 days", ms: 3 * 24 * 60 * 60 * 1000 },
];

function resolvePresetTime(label: string): Date {
  if (label === "Tomorrow morning") {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  const preset = presets.find((p) => p.label === label);
  return new Date(Date.now() + (preset?.ms ?? 60 * 60 * 1000));
}

export default function RemindersScreen() {
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
        title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
        fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted, marginBottom: 4 },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        chipSelected: { backgroundColor: colors.successTint, borderColor: colors.primary },
        chipText: { fontSize: 12, fontWeight: "600", color: colors.muted },
        chipTextSelected: { color: colors.primaryPress },
        reminderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        reminderTitle: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        reminderMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: reminders } = useQuery({
    queryKey: ["reminders", profileId],
    queryFn: () => fetchReminders(profileId as string),
    enabled: Boolean(profileId),
  });
  const { data: upcomingBookings } = useQuery({
    queryKey: ["upcomingBookings", profileId],
    queryFn: () => fetchUpcomingBookings(profileId as string),
    enabled: Boolean(profileId),
  });

  async function handleCreate() {
    if (!profileId || !title.trim() || !selectedPreset) return;
    setIsSaving(true);
    try {
      await createReminder({
        profile_id: profileId,
        title,
        remind_at: resolvePresetTime(selectedPreset).toISOString(),
        booking_id: selectedBookingId,
      });
      setTitle("");
      setSelectedPreset(null);
      setSelectedBookingId(null);
      void queryClient.invalidateQueries({ queryKey: ["reminders", profileId] });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteReminder(id);
    void queryClient.invalidateQueries({ queryKey: ["reminders", profileId] });
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
        <Text style={styles.title}>Reminders</Text>
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>New reminder</Text>
        <TextField label="What should we remind you about?" placeholder="e.g. Take evening medication" value={title} onChangeText={setTitle} />

        <Text style={styles.fieldLabel}>When</Text>
        <View style={styles.chipRow}>
          {presets.map((preset) => (
            <Pressable
              key={preset.label}
              style={[styles.chip, selectedPreset === preset.label && styles.chipSelected]}
              onPress={() => setSelectedPreset(preset.label)}
            >
              <Text style={[styles.chipText, selectedPreset === preset.label && styles.chipTextSelected]}>{preset.label}</Text>
            </Pressable>
          ))}
        </View>

        {upcomingBookings && upcomingBookings.length > 0 ? (
          <>
            <Text style={styles.fieldLabel}>Link to a booking (optional)</Text>
            <View style={styles.chipRow}>
              {upcomingBookings.map((booking) => (
                <Pressable
                  key={booking.id}
                  style={[styles.chip, selectedBookingId === booking.id && styles.chipSelected]}
                  onPress={() => setSelectedBookingId(selectedBookingId === booking.id ? null : booking.id)}
                >
                  <Text style={[styles.chipText, selectedBookingId === booking.id && styles.chipTextSelected]}>
                    {new Date(booking.scheduled_at).toLocaleDateString("en-IN")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Button
          label={isSaving ? "Saving..." : "Set reminder"}
          disabled={!title.trim() || !selectedPreset || isSaving}
          onPress={() => void handleCreate()}
        />
      </Card>

      <Text style={styles.sectionTitle}>Upcoming reminders</Text>
      {reminders === undefined ? (
        <Skeleton height={60} borderRadius={16} />
      ) : reminders.filter((r) => !r.is_sent).length === 0 ? (
        <EmptyState icon={<AlarmClock size={26} color={colors.primary} strokeWidth={1.6} />} title="No reminders set" />
      ) : (
        <View style={{ gap: 8 }}>
          {reminders
            .filter((r) => !r.is_sent)
            .map((reminder) => (
              <Card key={reminder.id} style={styles.reminderRow}>
                <AlarmClock size={18} color={colors.primary} strokeWidth={1.8} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderMeta}>{new Date(reminder.remind_at).toLocaleString("en-IN")}</Text>
                </View>
                <Pressable onPress={() => void handleDelete(reminder.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete reminder">
                  <Trash2 size={16} color={colors.error} strokeWidth={1.8} />
                </Pressable>
              </Card>
            ))}
        </View>
      )}
    </ScrollView>
  );
}
