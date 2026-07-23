import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarOff, Check, Send, UserPlus, Users, X } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  cancelInvitation,
  createTeam,
  fetchMyTeam,
  fetchSentInvitations,
  fetchTeamRoster,
  fetchTeamTimeOff,
  reviewTimeOff,
  useSessionStore,
  type TeamInvitationStatus,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, StatusPill, curalinkPlusFonts, useTheme } from "@curalink/ui";

const invitationStatusColors: Record<TeamInvitationStatus, { fg: string; bg: string }> = {
  pending: { fg: "#B7791F", bg: "#FFF6E5" },
  accepted: { fg: "#0B5A45", bg: "#E8F5F0" },
  rejected: { fg: "#DC3545", bg: "#FCE8E8" },
  cancelled: { fg: "#64748B", bg: "#EEF1F4" },
};


export default function TeamScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    emptyTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
    emptyBody: { fontSize: 12.5, color: colors.muted, textAlign: "center" },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
    applicationCard: { flexDirection: "row", alignItems: "center", gap: 8 },
    applicantName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
    applicantRole: { fontSize: 11.5, color: colors.muted, textTransform: "capitalize", marginTop: 1 },
    timeOffCard: { flexDirection: "row", alignItems: "center", gap: 8 },
    timeOffDates: { fontSize: 13, fontWeight: "700", color: colors.ink },
    timeOffReason: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
    memberCard: { flexDirection: "row", justifyContent: "space-between" },
    memberRole: { fontSize: 13, fontWeight: "700", color: colors.ink, textTransform: "capitalize" },
    memberStatus: { fontSize: 12, color: colors.muted },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [actioningKey, setActioningKey] = useState<string | null>(null);

  const { data: team } = useQuery({
    queryKey: ["myTeam", userId],
    queryFn: () => fetchMyTeam(userId as string),
    enabled: Boolean(userId),
  });
  const { data: roster } = useQuery({
    queryKey: ["teamRoster", team?.id],
    queryFn: () => fetchTeamRoster(team?.id as string),
    enabled: Boolean(team?.id),
  });
  const { data: invitations } = useQuery({
    queryKey: ["sentInvitations", team?.id],
    queryFn: () => fetchSentInvitations(team?.id as string),
    enabled: Boolean(team?.id),
  });
  const rosterIds = (roster ?? []).map((m) => m.professional_id);
  const { data: timeOffRequests } = useQuery({
    queryKey: ["teamTimeOff", team?.id],
    queryFn: () => fetchTeamTimeOff(rosterIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });
  const pendingTimeOff = (timeOffRequests ?? []).filter((r) => r.status === "requested");

  async function handleCreateTeam() {
    if (!userId) return;
    setIsCreatingTeam(true);
    try {
      await createTeam(userId, "My team");
      void queryClient.invalidateQueries({ queryKey: ["myTeam", userId] });
    } finally {
      setIsCreatingTeam(false);
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    setActioningKey(invitationId);
    try {
      await cancelInvitation(invitationId);
      void queryClient.invalidateQueries({ queryKey: ["sentInvitations", team?.id] });
    } finally {
      setActioningKey(null);
    }
  }

  async function handleReviewTimeOff(id: string, status: "approved" | "rejected") {
    setActioningKey(id);
    try {
      await reviewTimeOff(id, status);
      void queryClient.invalidateQueries({ queryKey: ["teamTimeOff", team?.id] });
    } finally {
      setActioningKey(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Team</Text>

      {team === null ? (
        <Card style={{ gap: 10, alignItems: "center" }}>
          <Text style={styles.emptyTitle}>No team yet</Text>
          <Text style={styles.emptyBody}>Create your team to start inviting verified professionals and managing a roster.</Text>
          <Button label={isCreatingTeam ? "Creating..." : "Create your team"} disabled={isCreatingTeam} onPress={() => void handleCreateTeam()} />
        </Card>
      ) : (
        <>
          <View style={styles.sectionHeaderRow}>
            <Send size={16} color={colors.primary} strokeWidth={1.8} />
            <Text style={[styles.sectionTitle, { flex: 1 }]}>Sent invitations</Text>
            <Button
              label="Invite"
              variant="secondary"
              icon={<UserPlus size={15} color={colors.ink} />}
              onPress={() => router.push("/add-team-member")}
            />
          </View>
          {invitations === undefined ? (
            <Skeleton height={70} borderRadius={13} />
          ) : invitations.length === 0 ? (
            <EmptyState icon={<Send size={24} color={colors.primary} strokeWidth={1.6} />} title="No invitations sent yet" />
          ) : (
            <View style={{ gap: 8 }}>
              {invitations.map(({ invitation, profile }) => {
                const isActioning = actioningKey === invitation.id;
                const statusColor = invitationStatusColors[invitation.status];
                return (
                  <Card key={invitation.id} style={styles.applicationCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.applicantName}>{profile?.full_name ?? "Applicant"}</Text>
                      <Text style={styles.applicantRole}>{invitation.role}</Text>
                    </View>
                    <StatusPill label={invitation.status} {...statusColor} />
                    {invitation.status === "pending" ? (
                      <Button
                        size="icon"
                        variant="secondary"
                        disabled={isActioning}
                        icon={<X size={16} color={colors.error} />}
                        onPress={() => void handleCancelInvitation(invitation.id)}
                      />
                    ) : null}
                  </Card>
                );
              })}
            </View>
          )}

          {pendingTimeOff.length > 0 ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <CalendarOff size={16} color={colors.primary} strokeWidth={1.8} />
                <Text style={styles.sectionTitle}>Time off requests</Text>
              </View>
              <View style={{ gap: 8 }}>
                {pendingTimeOff.map((request) => (
                  <Card key={request.id} style={styles.timeOffCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timeOffDates}>
                        {request.start_date} – {request.end_date}
                      </Text>
                      {request.reason ? <Text style={styles.timeOffReason}>{request.reason}</Text> : null}
                    </View>
                    <Button
                      size="icon"
                      variant="secondary"
                      disabled={actioningKey === request.id}
                      icon={<X size={16} color={colors.error} />}
                      onPress={() => void handleReviewTimeOff(request.id, "rejected")}
                    />
                    <Button
                      size="icon"
                      disabled={actioningKey === request.id}
                      icon={<Check size={16} color="#FFFFFF" />}
                      onPress={() => void handleReviewTimeOff(request.id, "approved")}
                    />
                  </Card>
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Roster</Text>
          </View>
          {roster === undefined ? (
            <Skeleton height={80} borderRadius={13} />
          ) : roster.length === 0 ? (
            <EmptyState icon={<Users size={26} color={colors.primary} strokeWidth={1.6} />} title="No team members yet" />
          ) : (
            <View style={{ gap: 8 }}>
              {roster.map((member) => (
                <Pressable key={member.id} onPress={() => router.push(`/team-member/${member.id}`)}>
                  <Card style={styles.memberCard}>
                    <Text style={styles.memberRole}>{member.role}</Text>
                    <Text style={styles.memberStatus}>{member.status}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
