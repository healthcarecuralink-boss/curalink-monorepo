import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  approveVerification,
  fetchPendingVerifications,
  rejectVerification,
  signOut,
  useSessionStore,
  type Json,
} from "@curalink/api-client";
import { CheckCircle2 } from "lucide-react-native";
import { Button, Card, EmptyState, Skeleton, useTheme } from "@curalink/ui";

function renderJson(value: Json): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(renderJson).join(", ") || "—";
  return Object.entries(value)
    .map(([k, v]) => `${k}: ${renderJson(v ?? null)}`)
    .join(" · ") || "—";
}

export default function VerificationQueueScreen() {
  const { colors } = useTheme();
  const session = useSessionStore((s) => s.session);
  const profile = useSessionStore((s) => s.profile);
  const isLoading = useSessionStore((s) => s.isLoading);
  const queryClient = useQueryClient();
  const [actioningKey, setActioningKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !session) router.replace("/login");
  }, [isLoading, session]);

  const isStaff = Boolean(profile?.is_curalink_staff);

  const { data: pending } = useQuery({
    queryKey: ["pendingVerifications"],
    queryFn: () => fetchPendingVerifications(),
    enabled: isStaff,
  });

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: colors.ink },
    subtitle: { fontSize: 13, color: colors.muted },
    applicantName: { fontSize: 14, fontWeight: "700", color: colors.ink },
    applicantRole: { fontSize: 12, color: colors.muted, textTransform: "capitalize", marginTop: 1 },
    docsBlock: { fontSize: 11.5, color: colors.muted, marginTop: 8, lineHeight: 16 },
    actionsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  });

  if (isLoading || !session) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Skeleton height={70} borderRadius={13} />
        </View>
      </View>
    );
  }

  if (!isStaff) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Not authorized</Text>
          <Text style={styles.subtitle}>This account isn't CuraLink staff.</Text>
          <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        </View>
      </View>
    );
  }

  async function handleDecision(profileId: string, role: string, approve: boolean) {
    const key = `${profileId}-${role}`;
    setActioningKey(key);
    try {
      if (approve) {
        await approveVerification(profileId, role);
      } else {
        await rejectVerification(profileId, role);
      }
      void queryClient.invalidateQueries({ queryKey: ["pendingVerifications"] });
    } finally {
      setActioningKey(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.title}>Verification queue</Text>
        <Text style={styles.subtitle}>{profile?.full_name}</Text>
      </View>

      {pending === undefined ? (
        <Skeleton height={100} borderRadius={13} />
      ) : pending.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={26} color={colors.primary} strokeWidth={1.6} />} title="Nothing pending" />
      ) : (
        <View style={{ gap: 10 }}>
          {pending.flatMap((entry) =>
            entry.credentials.pending_roles.map((role) => {
              const key = `${entry.credentials.profile_id}-${role}`;
              const isActioning = actioningKey === key;
              return (
                <Card key={key}>
                  <Text style={styles.applicantName}>{entry.applicant?.full_name ?? "Applicant"}</Text>
                  <Text style={styles.applicantRole}>{role}</Text>
                  <Text style={styles.docsBlock}>Credentials: {renderJson(entry.credentials.credentials)}</Text>
                  <Text style={styles.docsBlock}>Docs: {renderJson(entry.credentials.docs)}</Text>
                  <View style={styles.actionsRow}>
                    <Button
                      label="Reject"
                      variant="secondary"
                      disabled={isActioning}
                      onPress={() => void handleDecision(entry.credentials.profile_id, role, false)}
                    />
                    <Button
                      label="Approve"
                      disabled={isActioning}
                      onPress={() => void handleDecision(entry.credentials.profile_id, role, true)}
                    />
                  </View>
                </Card>
              );
            }),
          )}
        </View>
      )}

      <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
    </ScrollView>
  );
}
