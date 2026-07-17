import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, ShieldQuestion } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchMyTeam,
  fetchTeamRosterWithProfiles,
  updateTeamMemberDocsOk,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";

export default function ComplianceScreen() {
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
        sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
        memberRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        memberName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        memberRole: { fontSize: 11.5, color: colors.muted, textTransform: "capitalize", marginTop: 1 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const adminId = session?.user.id;
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { data: team } = useQuery({
    queryKey: ["myTeam", adminId],
    queryFn: () => fetchMyTeam(adminId as string),
    enabled: Boolean(adminId),
  });
  const { data: roster } = useQuery({
    queryKey: ["teamRosterWithProfiles", team?.id],
    queryFn: () => fetchTeamRosterWithProfiles(team?.id as string),
    enabled: Boolean(team?.id),
  });

  async function toggleDocsOk(memberId: string, next: boolean) {
    setActioningId(memberId);
    try {
      await updateTeamMemberDocsOk(memberId, next);
      void queryClient.invalidateQueries({ queryKey: ["teamRosterWithProfiles", team?.id] });
    } finally {
      setActioningId(null);
    }
  }

  const needsReview = (roster ?? []).filter((r) => !r.member.docs_ok);
  const verified = (roster ?? []).filter((r) => r.member.docs_ok);

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
        <Text style={styles.title}>Compliance</Text>
      </View>

      <Text style={styles.sectionTitle}>Needs document review</Text>
      {roster === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : needsReview.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={26} color={colors.primary} strokeWidth={1.6} />} title="Everyone's documents are verified" />
      ) : (
        <View style={{ gap: 8 }}>
          {needsReview.map(({ member, profile }) => (
            <Card key={member.id} style={styles.memberRow}>
              <ShieldQuestion size={20} color={colors.error} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{profile?.full_name ?? "Team member"}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              <Button
                label="Mark verified"
                variant="secondary"
                size="default"
                disabled={actioningId === member.id}
                onPress={() => void toggleDocsOk(member.id, true)}
              />
            </Card>
          ))}
        </View>
      )}

      {verified.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Verified</Text>
          <View style={{ gap: 8 }}>
            {verified.map(({ member, profile }) => (
              <Card key={member.id} style={styles.memberRow}>
                <ShieldCheck size={20} color={colors.primary} strokeWidth={1.8} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{profile?.full_name ?? "Team member"}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
