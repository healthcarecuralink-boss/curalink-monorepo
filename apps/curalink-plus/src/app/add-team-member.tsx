import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserPlus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { addTeamMemberByPhone, fetchMyTeam, useSessionStore } from "@curalink/api-client";
import { Button, Card, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";

const ROLES = ["nurse", "doctor", "vet", "pharmacy", "ambulance"] as const;

export default function AddTeamMemberScreen() {
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
        fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted, marginBottom: 4 },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 99,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          textTransform: "capitalize",
        },
        chipSelected: { backgroundColor: "#E8F5F0", borderColor: colors.primary },
        chipText: { fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "capitalize" },
        chipTextSelected: { color: colors.primary },
        note: { fontSize: 11.5, color: colors.muted },
        errorText: { fontSize: 12, color: colors.error },
        successCard: { gap: 6, alignItems: "center" },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const adminId = session?.user.id;
  const queryClient = useQueryClient();

  const { data: team } = useQuery({
    queryKey: ["myTeam", adminId],
    queryFn: () => fetchMyTeam(adminId as string),
    enabled: Boolean(adminId),
  });

  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedName, setAddedName] = useState<string | null>(null);

  async function handleAdd() {
    if (!team?.id || !role || !phone.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addTeamMemberByPhone(phone.trim(), role, team.id);
      void queryClient.invalidateQueries({ queryKey: ["teamRoster", team.id] });
      setAddedName(phone.trim());
      setPhone("");
      setRole(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that number");
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
        <Text style={styles.title}>Add team member</Text>
      </View>

      <Text style={styles.note}>
        Add someone who already has a CuraLink Plus account straight onto your roster, without waiting for them to apply.
      </Text>

      {addedName ? (
        <Card style={styles.successCard}>
          <UserPlus size={22} color={colors.primary} strokeWidth={1.6} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}>Added to your roster</Text>
        </Card>
      ) : null}

      <Card style={{ gap: 12 }}>
        <TextField label="Phone number" placeholder="+91XXXXXXXXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.chipRow}>
          {ROLES.map((r) => (
            <Pressable key={r} style={[styles.chip, role === r && styles.chipSelected]} onPress={() => setRole(r)}>
              <Text style={[styles.chipText, role === r && styles.chipTextSelected]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={isSubmitting ? "Adding..." : "Add to roster"}
          disabled={isSubmitting || !phone.trim() || !role}
          onPress={() => void handleAdd()}
        />
      </Card>
    </ScrollView>
  );
}
