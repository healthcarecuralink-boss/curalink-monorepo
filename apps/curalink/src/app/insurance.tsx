import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus, ShieldCheck } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  createInsuranceClaim,
  createInsurancePolicy,
  fetchInsuranceClaims,
  fetchInsurancePolicies,
  fetchPastBookings,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, StatusPill, TextField, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";

const claimStatusPill = (status: string) => {
  switch (status) {
    case "submitted":
      return curalinkStatusPillColors.pending;
    case "under_review":
      return curalinkStatusPillColors.confirmed;
    case "approved":
    case "paid":
      return curalinkStatusPillColors.completed;
    default:
      return curalinkStatusPillColors.cancelled;
  }
};

export default function InsuranceScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
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
        title: { fontFamily: curalinkFonts.heading, fontSize: 19, color: colors.ink },
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
        policyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        policyName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        policyMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        chipSelected: { backgroundColor: colors.successTint, borderColor: colors.primary },
        chipText: { fontSize: 12, fontWeight: "600", color: colors.muted },
        chipTextSelected: { color: colors.primaryPress },
        claimRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
        claimAmount: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        claimMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
        fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted, marginBottom: 4 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();

  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [claimAmount, setClaimAmount] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [isSavingClaim, setIsSavingClaim] = useState(false);

  const { data: policies } = useQuery({
    queryKey: ["insurancePolicies", profileId],
    queryFn: () => fetchInsurancePolicies(profileId as string),
    enabled: Boolean(profileId),
  });
  const { data: claims } = useQuery({
    queryKey: ["insuranceClaims", profileId],
    queryFn: () => fetchInsuranceClaims(profileId as string),
    enabled: Boolean(profileId),
  });
  const { data: pastBookings } = useQuery({
    queryKey: ["pastBookings", profileId],
    queryFn: () => fetchPastBookings(profileId as string),
    enabled: Boolean(profileId) && showClaimForm,
  });
  const completedBookings = (pastBookings ?? []).filter((b) => b.status === "completed");

  async function handleAddPolicy() {
    if (!profileId || !providerName.trim() || !policyNumber.trim()) return;
    setIsSavingPolicy(true);
    try {
      await createInsurancePolicy({
        profile_id: profileId,
        provider_name: providerName,
        policy_number: policyNumber,
        expiry_date: expiryDate.trim() || null,
      });
      setProviderName("");
      setPolicyNumber("");
      setExpiryDate("");
      setShowPolicyForm(false);
      void queryClient.invalidateQueries({ queryKey: ["insurancePolicies", profileId] });
    } finally {
      setIsSavingPolicy(false);
    }
  }

  async function handleSubmitClaim() {
    if (!profileId || !selectedPolicyId || !selectedBookingId || !claimAmount.trim()) return;
    setIsSavingClaim(true);
    try {
      await createInsuranceClaim({
        policy_id: selectedPolicyId,
        profile_id: profileId,
        booking_id: selectedBookingId,
        claim_amount: Number(claimAmount),
        description: claimDescription || null,
      });
      setSelectedPolicyId(null);
      setSelectedBookingId(null);
      setClaimAmount("");
      setClaimDescription("");
      setShowClaimForm(false);
      void queryClient.invalidateQueries({ queryKey: ["insuranceClaims", profileId] });
    } finally {
      setIsSavingClaim(false);
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
        <Text style={styles.title}>Insurance & claims</Text>
      </View>

      <Text style={styles.sectionTitle}>Your policies</Text>
      {policies === undefined ? (
        <Skeleton height={60} borderRadius={16} />
      ) : policies.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={26} color={colors.primary} strokeWidth={1.6} />} title="No policies added yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {policies.map((policy) => (
            <Card key={policy.id} style={styles.policyRow}>
              <ShieldCheck size={18} color={colors.primary} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={styles.policyName}>{policy.provider_name}</Text>
                <Text style={styles.policyMeta}>
                  Policy #{policy.policy_number}
                  {policy.expiry_date ? ` · Expires ${policy.expiry_date}` : ""}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {!showPolicyForm ? (
        <Button label="Add insurance policy" variant="secondary" icon={<Plus size={16} color={colors.ink} />} onPress={() => setShowPolicyForm(true)} />
      ) : (
        <Card style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Add policy</Text>
          <TextField label="Insurance provider" value={providerName} onChangeText={setProviderName} />
          <TextField label="Policy number" value={policyNumber} onChangeText={setPolicyNumber} />
          <TextField label="Expiry date (optional, YYYY-MM-DD)" placeholder="2027-12-31" value={expiryDate} onChangeText={setExpiryDate} />
          <Button
            label={isSavingPolicy ? "Saving..." : "Save policy"}
            disabled={!providerName.trim() || !policyNumber.trim() || isSavingPolicy}
            onPress={() => void handleAddPolicy()}
          />
        </Card>
      )}

      {!showClaimForm ? (
        <Button
          label="File a claim"
          icon={<FileText size={16} color="#FFFFFF" />}
          disabled={!policies || policies.length === 0}
          onPress={() => setShowClaimForm(true)}
        />
      ) : (
        <Card style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>File a claim</Text>

          <Text style={styles.fieldLabel}>Policy</Text>
          <View style={styles.chipRow}>
            {(policies ?? []).map((policy) => (
              <Pressable
                key={policy.id}
                style={[styles.chip, selectedPolicyId === policy.id && styles.chipSelected]}
                onPress={() => setSelectedPolicyId(policy.id)}
              >
                <Text style={[styles.chipText, selectedPolicyId === policy.id && styles.chipTextSelected]}>{policy.provider_name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Visit to claim for</Text>
          {completedBookings.length === 0 ? (
            <Text style={styles.policyMeta}>No completed visits yet to file a claim against.</Text>
          ) : (
            <View style={styles.chipRow}>
              {completedBookings.map((booking) => (
                <Pressable
                  key={booking.id}
                  style={[styles.chip, selectedBookingId === booking.id && styles.chipSelected]}
                  onPress={() => setSelectedBookingId(booking.id)}
                >
                  <Text style={[styles.chipText, selectedBookingId === booking.id && styles.chipTextSelected]}>
                    {new Date(booking.scheduled_at).toLocaleDateString("en-IN")} · ₹{booking.price}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <TextField label="Claim amount (₹)" keyboardType="number-pad" value={claimAmount} onChangeText={setClaimAmount} />
          <TextField label="Description (optional)" value={claimDescription} onChangeText={setClaimDescription} multiline />
          <Button
            label={isSavingClaim ? "Submitting..." : "Submit claim"}
            disabled={!selectedPolicyId || !selectedBookingId || !claimAmount.trim() || isSavingClaim}
            onPress={() => void handleSubmitClaim()}
          />
        </Card>
      )}

      <Text style={styles.sectionTitle}>Your claims</Text>
      {claims === undefined ? (
        <Skeleton height={70} borderRadius={16} />
      ) : claims.length === 0 ? (
        <EmptyState icon={<FileText size={26} color={colors.primary} strokeWidth={1.6} />} title="No claims filed yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {claims.map((claim) => (
            <Card key={claim.id} style={styles.claimRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.claimAmount}>₹{claim.claim_amount}</Text>
                <Text style={styles.claimMeta}>{new Date(claim.created_at).toLocaleDateString("en-IN")}</Text>
                {claim.description ? <Text style={styles.claimMeta}>{claim.description}</Text> : null}
              </View>
              <StatusPill label={claim.status.replace("_", " ")} {...claimStatusPill(claim.status)} />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
