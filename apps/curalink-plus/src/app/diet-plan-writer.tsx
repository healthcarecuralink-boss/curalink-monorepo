import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createDietPlan, useSessionStore } from "@curalink/api-client";
import { Button, Card, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";

interface MealEntry {
  time: string;
  meal: string;
}

export default function DietPlanWriterScreen() {
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
        mealRow: { flexDirection: "row", alignItems: "center", gap: 8 },
        mealTimeField: { width: 90 },
        mealNameField: { flex: 1 },
      }),
    [colors],
  );

  const { patientId, bookingId } = useLocalSearchParams<{ patientId: string; bookingId?: string }>();
  const session = useSessionStore((s) => s.session);
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("Diet plan");
  const [meals, setMeals] = useState<MealEntry[]>([{ time: "Breakfast", meal: "" }]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateMeal(index: number, patch: Partial<MealEntry>) {
    setMeals((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function addMealRow() {
    setMeals((prev) => [...prev, { time: "", meal: "" }]);
  }

  function removeMealRow(index: number) {
    setMeals((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const professionalId = session?.user.id;
    if (!professionalId || !patientId || !title.trim()) return;
    setIsSaving(true);
    try {
      await createDietPlan({
        patient_id: patientId,
        created_by: professionalId,
        title,
        meals: meals.filter((m) => m.meal.trim()) as never,
        notes: notes || null,
      });
      void queryClient.invalidateQueries({ queryKey: ["dietPlansForPatient", patientId] });
      if (bookingId) {
        router.replace(`/visit/${bookingId}`);
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
        <Text style={styles.title}>Diet plan</Text>
      </View>

      <TextField label="Plan title" value={title} onChangeText={setTitle} />

      <Card style={{ gap: 10 }}>
        {meals.map((meal, i) => (
          <View key={i} style={styles.mealRow}>
            <View style={styles.mealTimeField}>
              <TextField placeholder="Time" value={meal.time} onChangeText={(v) => updateMeal(i, { time: v })} />
            </View>
            <View style={styles.mealNameField}>
              <TextField placeholder="What to eat" value={meal.meal} onChangeText={(v) => updateMeal(i, { meal: v })} />
            </View>
            <Pressable onPress={() => removeMealRow(i)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove meal">
              <Trash2 size={16} color={colors.error} strokeWidth={1.8} />
            </Pressable>
          </View>
        ))}
        <Button label="Add meal" variant="secondary" icon={<Plus size={16} color={colors.ink} />} onPress={addMealRow} />
      </Card>

      <TextField label="Notes (optional)" placeholder="Foods to avoid, hydration goals, etc." multiline value={notes} onChangeText={setNotes} />

      <Button label={isSaving ? "Saving..." : "Save diet plan"} disabled={!title.trim() || isSaving} onPress={() => void handleSave()} />
    </ScrollView>
  );
}
