import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Send, X } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchMyTeamInvitations, respondToTeamInvitation, useSessionStore } from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";

export default function TeamInvitationsScreen() {
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
        invitationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
        teamName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        role: { fontSize: 11.5, color: colors.muted, textTransform: "capitalize", marginTop: 1 },
      }),
    [colors],
  );

  const profile = useSessionStore((s) => s.profile);
  const professionalId = profile?.id;
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { data: invitations } = useQuery({
    queryKey: ["myTeamInvitations", professionalId],
    queryFn: () => fetchMyTeamInvitations(professionalId as string),
    enabled: Boolean(professionalId),
  });

  async function handleRespond(invitationId: string, accept: boolean) {
    setActioningId(invitationId);
    try {
      await respondToTeamInvitation(invitationId, accept);
      void queryClient.invalidateQueries({ queryKey: ["myTeamInvitations", professionalId] });
      void queryClient.invalidateQueries({ queryKey: ["teamRoster"] });
    } finally {
      setActioningId(null);
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
        <Text style={styles.title}>Team invitations</Text>
      </View>

      {invitations === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : invitations.length === 0 ? (
        <EmptyState icon={<Send size={26} color={colors.primary} strokeWidth={1.6} />} title="No pending invitations" />
      ) : (
        <View style={{ gap: 8 }}>
          {invitations.map(({ invitation, teamName }) => {
            const isActioning = actioningId === invitation.id;
            return (
              <Card key={invitation.id} style={styles.invitationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{teamName ?? "A partner agency"}</Text>
                  <Text style={styles.role}>wants you as {invitation.role}</Text>
                </View>
                <Button
                  size="icon"
                  variant="secondary"
                  disabled={isActioning}
                  icon={<X size={16} color={colors.error} />}
                  onPress={() => void handleRespond(invitation.id, false)}
                />
                <Button
                  size="icon"
                  disabled={isActioning}
                  icon={<Check size={16} color="#FFFFFF" />}
                  onPress={() => void handleRespond(invitation.id, true)}
                />
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
