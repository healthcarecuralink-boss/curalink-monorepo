import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createEnrollment, fetchMyEnrollments, useSessionStore } from "@curalink/api-client";
import { Button, Card, TextField, curalinkFonts, useTheme } from "@curalink/ui";

const plans = [
  {
    key: "care" as const,
    name: "Care",
    price: "Free",
    perks: ["Book any service", "Track visits live", "Wallet & prescriptions"],
    isFree: true,
  },
  {
    key: "care_plus" as const,
    name: "Care Plus",
    price: "₹299/mo",
    perks: ["10% off every visit", "Priority provider matching", "Free medicine delivery"],
    highlight: true,
  },
  {
    key: "family_plus" as const,
    name: "Family Plus",
    price: "₹599/mo",
    perks: ["Everything in Care Plus", "Covers up to 5 family members", "Dedicated care coordinator"],
  },
];

export default function SubscriptionPlansScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 14 },
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
        planCard: { gap: 12 },
        planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        planName: { fontFamily: curalinkFonts.headingSemibold, fontSize: 16, color: colors.ink },
        planPrice: { fontFamily: curalinkFonts.heading, fontSize: 15, color: colors.primary },
        perkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
        perkText: { fontSize: 12.5, color: colors.ink2 },
        cta: { marginTop: 4 },
        moreLink: { alignItems: "center", paddingVertical: 8 },
        moreLinkText: { fontSize: 12.5, fontWeight: "600", color: colors.primary },
        requestedNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
        requestedText: { fontSize: 12, fontWeight: "600", color: colors.primary },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: enrollments } = useQuery({
    queryKey: ["myEnrollments", profileId],
    queryFn: () => fetchMyEnrollments(profileId as string),
    enabled: Boolean(profileId),
  });

  const alreadyRequested = (key: string) => (enrollments ?? []).some((e) => e.program_key === key);

  async function handleSubmit(planKey: "care_plus" | "family_plus") {
    if (!profileId) return;
    setIsSubmitting(true);
    try {
      await createEnrollment({ consumer_id: profileId, program_key: planKey, notes: notes || null });
      setExpandedPlan(null);
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["myEnrollments", profileId] });
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
        <Text style={styles.title}>Plans</Text>
      </View>

      {plans.map((plan) => {
        const requested = !plan.isFree && alreadyRequested(plan.key);
        return (
          <Card key={plan.key} style={[styles.planCard, plan.highlight && { borderColor: colors.primary, borderWidth: 1.5 }]}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            <View style={{ gap: 8 }}>
              {plan.perks.map((perk) => (
                <View key={perk} style={styles.perkRow}>
                  <Check size={14} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>

            {plan.isFree ? (
              <Button label="Your current plan" variant="secondary" disabled style={styles.cta} />
            ) : requested ? (
              <View style={styles.requestedNote}>
                <Check size={14} color={colors.primary} />
                <Text style={styles.requestedText}>Request sent — our team will follow up to activate this</Text>
              </View>
            ) : expandedPlan === plan.key ? (
              <View style={{ gap: 10 }}>
                <TextField placeholder="Anything we should know? (optional)" value={notes} onChangeText={setNotes} multiline />
                <Button
                  label={isSubmitting ? "Sending..." : "Send request"}
                  disabled={isSubmitting}
                  onPress={() => void handleSubmit(plan.key as "care_plus" | "family_plus")}
                />
              </View>
            ) : (
              <Button label="Request to upgrade" style={styles.cta} onPress={() => setExpandedPlan(plan.key)} />
            )}
          </Card>
        );
      })}

      <Pressable style={styles.moreLink} onPress={() => router.push("/care-programs")}>
        <Text style={styles.moreLinkText}>Looking for a specific care program instead? →</Text>
      </Pressable>
    </ScrollView>
  );
}
