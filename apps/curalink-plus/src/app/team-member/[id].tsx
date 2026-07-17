import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, ShieldX } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchTeamMemberDetail, updateTeamMemberStatus, type TeamMemberDetail } from "@curalink/api-client";
import { Button, Card, Skeleton, StatusPill, curalinkPlusFonts, useTheme, type ThemeContextValue } from "@curalink/ui";

type MemberStatus = TeamMemberDetail["member"]["status"];

const statusColors: Record<MemberStatus, { fg: string; bg: string }> = {
  active: { fg: "#0B5A45", bg: "#E8F5F0" },
  inactive: { fg: "#64748B", bg: "#EEF1F4" },
  suspended: { fg: "#DC3545", bg: "#FCE8E8" },
};

function Row({ label, value, colors }: { label: string; value: string; colors: ThemeContextValue["colors"] }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 12.5, color: colors.ink, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 12 }}>{value}</Text>
    </View>
  );
}

export default function TeamMemberDetailScreen() {
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
        title: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 18, color: colors.ink },
        subtitle: { fontSize: 12, color: colors.muted, marginTop: 1, textTransform: "capitalize" },
        sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
        docsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
        docsText: { fontSize: 13, fontWeight: "600" },
        actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
      }),
    [colors],
  );

  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ["teamMemberDetail", id],
    queryFn: () => fetchTeamMemberDetail(id),
    enabled: Boolean(id),
  });

  async function handleSetStatus(status: MemberStatus) {
    setIsSubmitting(true);
    try {
      await updateTeamMemberStatus(id, status);
      void queryClient.invalidateQueries({ queryKey: ["teamMemberDetail", id] });
      void queryClient.invalidateQueries({ queryKey: ["teamRoster"] });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={13} />
      </View>
    );
  }

  const { member, profile, professionalProfile, credentials } = detail;

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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{profile?.full_name ?? "Team member"}</Text>
          <Text style={styles.subtitle}>{member.role}</Text>
        </View>
        <StatusPill label={member.status} {...statusColors[member.status]} />
      </View>

      <Card>
        <Row label="Phone" value={profile?.phone ?? "—"} colors={colors} />
        <Row label="Joined" value={new Date(member.joined_at).toLocaleDateString("en-IN")} colors={colors} />
        {professionalProfile ? (
          <>
            <Row label="Rating" value={professionalProfile.rating.toFixed(1)} colors={colors} />
            <Row label="On duty" value={professionalProfile.is_on_duty ? "Yes" : "No"} colors={colors} />
          </>
        ) : null}
        <Row label="Verification" value={credentials?.verification_status ?? "—"} colors={colors} />
      </Card>

      <Card style={styles.docsRow}>
        {member.docs_ok ? (
          <ShieldCheck size={20} color={colors.primary} strokeWidth={1.8} />
        ) : (
          <ShieldX size={20} color={colors.error} strokeWidth={1.8} />
        )}
        <Text style={[styles.docsText, { color: member.docs_ok ? colors.primary : colors.error, flex: 1 }]}>
          {member.docs_ok ? "Documents verified" : "Documents not yet verified"}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }} onPress={() => router.push("/compliance")}>
          Review
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Roster status</Text>
      <View style={styles.actionsRow}>
        <Button
          label="Active"
          variant={member.status === "active" ? "primary" : "secondary"}
          disabled={isSubmitting || member.status === "active"}
          onPress={() => void handleSetStatus("active")}
        />
        <Button
          label="Inactive"
          variant={member.status === "inactive" ? "primary" : "secondary"}
          disabled={isSubmitting || member.status === "inactive"}
          onPress={() => void handleSetStatus("inactive")}
        />
        <Button
          label="Suspend"
          variant={member.status === "suspended" ? "destructive" : "secondary"}
          disabled={isSubmitting || member.status === "suspended"}
          onPress={() => void handleSetStatus("suspended")}
        />
      </View>
    </ScrollView>
  );
}
