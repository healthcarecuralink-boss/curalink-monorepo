import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { completeVisit } from "@curalink/api-client";
import { Button, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";


const checklistItems = [
  { key: "services", label: "All required services rendered" },
  { key: "followup", label: "Follow-up scheduled if needed" },
  { key: "briefed", label: "Family briefed on next steps" },
];

export default function CompleteVisitChecklistScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 60, gap: 20 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: -12 },
    checklistRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    checklistLabel: { fontSize: 13.5, color: colors.ink, flex: 1 },
        }),
      [colors],
    );
  const { id } = useLocalSearchParams<{ id: string }>();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [handoffNote, setHandoffNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = checklistItems.every((item) => checked[item.key]);

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      await completeVisit(id, handoffNote);
      router.replace(`/visit/${id}/completed`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete visit</Text>
      <Text style={styles.subtitle}>Confirm before wrapping up.</Text>

      <View style={{ gap: 10 }}>
        {checklistItems.map((item) => {
          const isChecked = checked[item.key];
          return (
            <Pressable
              key={item.key}
              style={styles.checklistRow}
              onPress={() => setChecked((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
            >
              <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                {isChecked ? <Check size={13} color="#FFFFFF" /> : null}
              </View>
              <Text style={styles.checklistLabel}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="Handoff note to care team"
        placeholder="Anything the next provider or care coordinator should know..."
        multiline
        value={handoffNote}
        onChangeText={setHandoffNote}
      />

      <Button
        label={isSubmitting ? "Completing..." : "Complete visit"}
        disabled={!allChecked || isSubmitting}
        onPress={() => void handleComplete()}
      />
    </ScrollView>
  );
}
