import { useEffect, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { supabase, useSessionStore, type ProfessionalRole } from "@curalink/api-client";
import { curalinkPlusFonts, useTheme } from "@curalink/ui";


const steps = [
  { key: "received", label: "Application received", done: true },
  { key: "docs", label: "Document verification", done: false },
  { key: "background", label: "Background check", done: false },
];

// Deliberately no "tap to simulate approval" shortcut here (the prototype
// has one) -- approve_role is restricted to CuraLink staff and RLS-enforced,
// so there is no legitimate client-side path to self-approve. This screen
// just polls for the real thing, which happens once CuraLink staff approves
// via the curalink-team app's verification queue.
export default function VerificationPendingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 110, alignItems: "center" },
    iconChip: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#FEF3E2",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink, textAlign: "center" },
    body: { fontSize: 13.5, color: colors.muted, textAlign: "center", marginTop: 10, lineHeight: 20 },
    stepsCard: {
      marginTop: 28,
      width: "100%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 16,
      gap: 14,
    },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    stepIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    stepLabel: { fontSize: 13, color: colors.ink },
        }),
      [colors],
    );
  const { role } = useLocalSearchParams<{ role: ProfessionalRole }>();
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const { data: isApproved } = useQuery({
    queryKey: ["roleApproved", userId, role],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("roles").eq("id", userId as string).single();
      return Boolean(role && data?.roles?.includes(role));
    },
    enabled: Boolean(userId && role),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (isApproved) {
      router.replace({ pathname: "/approved", params: { role } });
    }
  }, [isApproved, role]);

  return (
    <View style={styles.container}>
      <View style={styles.iconChip}>
        <Clock size={30} color={colors.amber} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Application submitted</Text>
      <Text style={styles.body}>
        We&apos;re verifying your documents and credentials. This usually takes under 24 hours — you&apos;ll get a
        notification the moment you&apos;re approved.
      </Text>

      <View style={styles.stepsCard}>
        {steps.map((step) => (
          <View key={step.key} style={styles.stepRow}>
            <View style={[styles.stepIcon, { backgroundColor: step.done ? "#E8F5F0" : "#F1F3F5" }]}>
              {step.done ? <Check size={13} color={colors.primary} /> : <Clock size={13} color={colors.muted} />}
            </View>
            <Text style={styles.stepLabel}>{step.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
