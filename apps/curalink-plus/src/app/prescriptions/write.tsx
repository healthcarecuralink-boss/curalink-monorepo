import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createPrescription, useSessionStore } from "@curalink/api-client";
import { Button, Card, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";

interface MedEntry {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function PrescriptionWriterScreen() {
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
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 18, color: colors.ink },
        medCard: { gap: 8 },
        medRowTop: { flexDirection: "row", gap: 8 },
        medField: { flex: 1 },
        removeRow: { alignSelf: "flex-end" },
      }),
    [colors],
  );

  const { patientId, bookingId } = useLocalSearchParams<{ patientId: string; bookingId?: string }>();
  const session = useSessionStore((s) => s.session);

  const [meds, setMeds] = useState<MedEntry[]>([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [advice, setAdvice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateMed(index: number, patch: Partial<MedEntry>) {
    setMeds((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function addMed() {
    setMeds((prev) => [...prev, { name: "", dosage: "", frequency: "", duration: "" }]);
  }

  function removeMed(index: number) {
    setMeds((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const doctorId = session?.user.id;
    if (!doctorId || !patientId) return;
    const validMeds = meds.filter((m) => m.name.trim());
    if (validMeds.length === 0) return;
    setIsSaving(true);
    try {
      await createPrescription({
        patient_id: patientId,
        doctor_id: doctorId,
        booking_id: bookingId || null,
        meds: validMeds as never,
        advice: advice || null,
      });
      if (bookingId) {
        router.replace(`/consult/${bookingId}`);
      } else {
        router.back();
      }
    } finally {
      setIsSaving(false);
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
        <Text style={styles.title}>Write prescription</Text>
      </View>

      {meds.map((med, i) => (
        <Card key={i} style={styles.medCard}>
          <TextField label="Medicine" value={med.name} onChangeText={(v) => updateMed(i, { name: v })} />
          <View style={styles.medRowTop}>
            <View style={styles.medField}>
              <TextField label="Dosage" placeholder="500mg" value={med.dosage} onChangeText={(v) => updateMed(i, { dosage: v })} />
            </View>
            <View style={styles.medField}>
              <TextField label="Frequency" placeholder="2x/day" value={med.frequency} onChangeText={(v) => updateMed(i, { frequency: v })} />
            </View>
          </View>
          <TextField label="Duration" placeholder="5 days" value={med.duration} onChangeText={(v) => updateMed(i, { duration: v })} />
          {meds.length > 1 ? (
            <Pressable style={styles.removeRow} onPress={() => removeMed(i)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove medicine">
              <Trash2 size={16} color={colors.error} strokeWidth={1.8} />
            </Pressable>
          ) : null}
        </Card>
      ))}

      <Button label="Add another medicine" variant="secondary" icon={<Plus size={16} color={colors.ink} />} onPress={addMed} />

      <TextField label="Advice (optional)" placeholder="Follow-up instructions, precautions..." multiline value={advice} onChangeText={setAdvice} />

      <Button
        label={isSaving ? "Saving..." : "Save & sign prescription"}
        disabled={isSaving || !meds.some((m) => m.name.trim())}
        onPress={() => void handleSave()}
      />
    </ScrollView>
  );
}
