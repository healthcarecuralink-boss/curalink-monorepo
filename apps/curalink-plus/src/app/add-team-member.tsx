import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, UserPlus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchMyTeam, inviteToTeam, searchVerifiedProfessionals, useSessionStore } from "@curalink/api-client";
import { Button, Card, EmptyState, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";

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
        resultRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        resultName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        resultPhone: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
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

  const [role, setRole] = useState<(typeof ROLES)[number] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  const trimmedQuery = query.trim();
  const { data: results } = useQuery({
    queryKey: ["verifiedProfessionalSearch", trimmedQuery, role],
    queryFn: () => searchVerifiedProfessionals(trimmedQuery, role ?? undefined),
    enabled: Boolean(role) && trimmedQuery.length >= 3,
  });

  async function handleInvite(professionalId: string) {
    if (!team?.id || !role) return;
    setInvitingId(professionalId);
    setError(null);
    try {
      await inviteToTeam(professionalId, role, team.id);
      setInvitedIds((ids) => [...ids, professionalId]);
      void queryClient.invalidateQueries({ queryKey: ["sentInvitations", team.id] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that request");
    } finally {
      setInvitingId(null);
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
        <Text style={styles.title}>Invite team member</Text>
      </View>

      <Text style={styles.note}>
        Search CuraLink-verified professionals by name or phone and send them a request to join your roster. They'll
        need to accept before they show up as a team member.
      </Text>

      <Card style={{ gap: 12 }}>
        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.chipRow}>
          {ROLES.map((r) => (
            <Pressable key={r} style={[styles.chip, role === r && styles.chipSelected]} onPress={() => setRole(r)}>
              <Text style={[styles.chipText, role === r && styles.chipTextSelected]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="Search by name, phone, or email"
          placeholder="e.g. Priya Nair, +91XXXXXXXXXX, or priya@email.com"
          value={query}
          onChangeText={setQuery}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>

      {!role ? null : trimmedQuery.length < 3 ? (
        <Text style={styles.note}>Type at least 3 characters to search.</Text>
      ) : results === undefined ? null : results.length === 0 ? (
        <EmptyState
          icon={<UserPlus size={24} color={colors.primary} strokeWidth={1.6} />}
          title="No matching verified professionals"
        />
      ) : (
        <View style={{ gap: 8 }}>
          {results.map((professional) => {
            const alreadyInvited = invitedIds.includes(professional.id);
            return (
              <Card key={professional.id} style={styles.resultRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{professional.full_name}</Text>
                  <Text style={styles.resultPhone}>{professional.phone ?? "—"}</Text>
                </View>
                <Button
                  label={alreadyInvited ? "Request sent" : "Send request"}
                  variant="secondary"
                  size="default"
                  icon={alreadyInvited ? undefined : <Send size={14} color={colors.ink} />}
                  disabled={alreadyInvited || invitingId === professional.id}
                  onPress={() => void handleInvite(professional.id)}
                />
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
