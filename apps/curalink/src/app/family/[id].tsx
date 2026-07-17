import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { deleteFamilyMember, fetchFamilyMember, updateFamilyMember } from "@curalink/api-client";
import { Button, Skeleton, TextField, curalinkFonts, useTheme } from "@curalink/ui";


export default function FamilyMemberDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 60, gap: 16 },
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
    subtitle: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
    form: { gap: 16, marginTop: 8 },
        }),
      [colors],
    );
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: member } = useQuery({
    queryKey: ["familyMember", id],
    queryFn: () => fetchFamilyMember(id),
    enabled: Boolean(id),
  });

  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // Initialize the editable form fields once the member loads -- adjusted
  // during render (React's recommended pattern for this), not in an effect,
  // since an effect here would fire a redundant extra render.
  const [loadedMemberId, setLoadedMemberId] = useState<string | null>(null);
  if (member && member.id !== loadedMemberId) {
    setLoadedMemberId(member.id);
    setBloodGroup(member.blood_group ?? "");
    setAllergies(member.allergies.join(", "));
    setConditions(member.conditions.join(", "));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateFamilyMember(id, {
        blood_group: bloodGroup || null,
        allergies: allergies ? allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
        conditions: conditions ? conditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      void queryClient.invalidateQueries({ queryKey: ["familyMember", id] });
      void queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      router.back();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    await deleteFamilyMember(id);
    void queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    router.back();
  }

  if (!member) {
    return (
      <View style={styles.container}>
        <Skeleton height={120} borderRadius={16} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text style={styles.title}>{member.full_name}</Text>
          <Text style={styles.subtitle}>{member.relation}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <TextField label="Blood group" placeholder="O+" value={bloodGroup} onChangeText={setBloodGroup} />
        <TextField
          label="Allergies (comma-separated)"
          placeholder="Penicillin, Peanuts"
          value={allergies}
          onChangeText={setAllergies}
        />
        <TextField
          label="Conditions (comma-separated)"
          placeholder="Type 2 diabetes, Hypertension"
          value={conditions}
          onChangeText={setConditions}
        />
      </View>

      <Button label={isSaving ? "Saving..." : "Save changes"} disabled={isSaving} onPress={() => void handleSave()} />

      {!member.is_self ? (
        <Button
          label="Remove from family"
          variant="destructive"
          icon={<Trash2 size={16} color={colors.error} />}
          onPress={() => void handleDelete()}
        />
      ) : null}
    </ScrollView>
  );
}
