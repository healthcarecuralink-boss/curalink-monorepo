import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createFamilyMember, useSessionStore } from "@curalink/api-client";
import { Button, TextField, curalinkFonts, useTheme } from "@curalink/ui";

const relations = ["Parent", "Spouse", "Child", "Sibling", "Pet", "Other"];

export default function AddFamilyMemberScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 70 },
    header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
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
    form: { gap: 16 },
    fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: -8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: { backgroundColor: "#E9FBF3", borderColor: colors.primary },
    chipText: { fontSize: 12.5, fontWeight: "600", color: colors.muted },
    chipTextSelected: { color: colors.primaryPress },
    cta: { marginTop: 28 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [relation, setRelation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const ownerId = session?.user.id;
    if (!ownerId || !relation || !fullName.trim()) return;
    setIsSaving(true);
    try {
      await createFamilyMember({
        owner_id: ownerId,
        full_name: fullName,
        relation,
        is_self: false,
        species: relation === "Pet" ? "Pet" : null,
      });
      void queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      router.back();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Add family member</Text>
      </View>

      <View style={styles.form}>
        <TextField label="Full name" placeholder="e.g. Rajesh Nair" value={fullName} onChangeText={setFullName} />

        <Text style={styles.fieldLabel}>Relation</Text>
        <View style={styles.chipRow}>
          {relations.map((option) => {
            const isSelected = option === relation;
            return (
              <Pressable
                key={option}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setRelation(option)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        label={isSaving ? "Adding..." : "Add to family"}
        disabled={isSaving || !relation || !fullName.trim()}
        onPress={() => void handleSave()}
        style={styles.cta}
      />
    </View>
  );
}
