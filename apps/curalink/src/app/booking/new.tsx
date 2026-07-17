import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Banknote, CreditCard, Smartphone, Wallet as WalletIcon, Zap } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  createAddress,
  createBooking,
  fetchAddresses,
  fetchFamilyMembers,
  fetchServiceById,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, Skeleton, StatusPill, TextField, curalinkFonts, useTheme } from "@curalink/ui";

// Razorpay isn't wired yet (pending business KYC) -- "Pay after care" is the
// only live option. UPI/Card/Wallet stay visible-but-disabled with a "Coming
// soon" pill so re-enabling them later is just flipping `enabled: true` here,
// no UI rework.
const PAYMENT_METHODS = [
  { id: "cash", name: "Pay after care", sub: "Cash or UPI to your provider when the visit is done", icon: Banknote, enabled: true },
  { id: "upi", name: "UPI", sub: "Coming soon", icon: Smartphone, enabled: false },
  { id: "card", name: "Card", sub: "Coming soon", icon: CreditCard, enabled: false },
  { id: "wallet", name: "CuraLink Wallet", sub: "Coming soon", icon: WalletIcon, enabled: false },
] as const;

const STEPS = ["who", "when", "where", "summary"] as const;
type Step = (typeof STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
  who: "Who is this for?",
  when: "When should they visit?",
  where: "Where should they visit?",
  summary: "Confirm your request",
};

const SCHEDULE_PRESETS = [
  { key: "asap", label: "ASAP — within the hour", isExpress: true },
  { key: "this_evening", label: "This evening", isExpress: false },
  { key: "tomorrow_morning", label: "Tomorrow morning", isExpress: false },
  { key: "in_2_days", label: "In 2 days", isExpress: false },
] as const;

function resolveScheduleTime(key: string): Date {
  const now = new Date();
  const d = new Date(now);
  switch (key) {
    case "asap":
      return now;
    case "this_evening":
      d.setHours(18, 0, 0, 0);
      if (d <= now) d.setDate(d.getDate() + 1);
      return d;
    case "tomorrow_morning":
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    case "in_2_days":
      d.setDate(d.getDate() + 2);
      d.setHours(9, 0, 0, 0);
      return d;
    default:
      return now;
  }
}

export default function NewBookingScreen() {
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
        stepDotsRow: { flexDirection: "row", gap: 6 },
        stepDot: { flex: 1, height: 4, borderRadius: 99, backgroundColor: colors.border2 },
        stepDotActive: { backgroundColor: colors.primary },
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 16, color: colors.ink },
        fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted, marginBottom: 8 },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        chipSelected: { backgroundColor: colors.successTint, borderColor: colors.primary },
        chipText: { fontSize: 12.5, fontWeight: "600", color: colors.muted },
        chipTextSelected: { color: colors.primaryPress },
        addressLine: { fontSize: 13, color: colors.ink2, marginTop: 2 },
        summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
        summaryLabel: { fontSize: 12.5, color: colors.muted },
        summaryValue: { fontSize: 12.5, fontWeight: "700", color: colors.ink, flexShrink: 1, textAlign: "right", marginLeft: 12 },
        footerRow: { flexDirection: "row", gap: 10 },
        payMethodsLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: colors.muted, marginTop: 4 },
        payMethodRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderWidth: 2,
          borderRadius: 16,
          padding: 13,
        },
        payMethodRowSelected: { backgroundColor: colors.successTint, borderColor: colors.primary },
        payMethodRowDisabled: { backgroundColor: colors.bg, borderColor: colors.border2, opacity: 0.55 },
        payMethodIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
        payMethodName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        payMethodSub: { fontSize: 11.5, color: colors.muted2, marginTop: 1 },
        payNote: { fontSize: 11.5, color: colors.muted2, textAlign: "center", marginTop: 2 },
      }),
    [colors],
  );

  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const session = useSessionStore((s) => s.session);
  const consumerId = session?.user.id;

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex] as Step;

  const [patientId, setPatientId] = useState<string | null>(null);
  const [scheduleKey, setScheduleKey] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [newAddressLabel, setNewAddressLabel] = useState("Home");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]["id"]>("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: service } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => fetchServiceById(serviceId),
    enabled: Boolean(serviceId),
  });
  const { data: familyMembers } = useQuery({
    queryKey: ["familyMembers", consumerId],
    queryFn: () => fetchFamilyMembers(consumerId as string),
    enabled: Boolean(consumerId),
  });
  const { data: addresses } = useQuery({
    queryKey: ["addresses", consumerId],
    queryFn: () => fetchAddresses(consumerId as string),
    enabled: Boolean(consumerId),
  });

  const selectedPatient = (familyMembers ?? []).find((m) => m.id === patientId);
  const selectedAddress = (addresses ?? []).find((a) => a.id === addressId);
  const selectedPreset = SCHEDULE_PRESETS.find((p) => p.key === scheduleKey);

  const canGoNext =
    (step === "who" && Boolean(patientId)) ||
    (step === "when" && Boolean(scheduleKey)) ||
    (step === "where" && (Boolean(addressId) || (addresses?.length === 0 && newAddressLine.trim().length > 0)));

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function goBack() {
    if (stepIndex === 0) {
      router.back();
    } else {
      setStepIndex((i) => i - 1);
    }
  }

  async function handleConfirm() {
    if (!consumerId || !service || !patientId || !scheduleKey) return;
    setIsSubmitting(true);
    try {
      let finalAddressId = addressId;
      if (!finalAddressId && newAddressLine.trim()) {
        const created = await createAddress({
          owner_id: consumerId,
          label: newAddressLabel || "Home",
          line1: newAddressLine.trim(),
        });
        finalAddressId = created.id;
      }
      const booking = await createBooking({
        consumer_id: consumerId,
        patient_id: patientId,
        service_id: service.id,
        address_id: finalAddressId,
        scheduled_at: resolveScheduleTime(scheduleKey).toISOString(),
        is_express: selectedPreset?.isExpress ?? false,
      });
      router.replace({ pathname: "/booking/success", params: { bookingId: booking.id } });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={18} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{service.name}</Text>
        </View>
      </View>

      <View style={styles.stepDotsRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>{STEP_TITLES[step]}</Text>

      {step === "who" ? (
        <Card style={{ gap: 12 }}>
          {familyMembers === undefined ? (
            <Skeleton height={70} borderRadius={13} />
          ) : familyMembers.length === 0 ? (
            <>
              <Text style={{ fontSize: 12.5, color: colors.muted }}>Add a family member first so we know who this visit is for.</Text>
              <Button label="Add family member" variant="secondary" onPress={() => router.push("/family/add")} />
            </>
          ) : (
            <View style={styles.chipRow}>
              {familyMembers.map((member) => (
                <Pressable
                  key={member.id}
                  style={[styles.chip, patientId === member.id && styles.chipSelected]}
                  onPress={() => setPatientId(member.id)}
                >
                  <Text style={[styles.chipText, patientId === member.id && styles.chipTextSelected]}>
                    {member.is_self ? "Myself" : member.full_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      ) : null}

      {step === "when" ? (
        <Card style={{ gap: 12 }}>
          <View style={styles.chipRow}>
            {SCHEDULE_PRESETS.filter((p) => p.key !== "asap" || service.is_express_eligible).map((preset) => (
              <Pressable
                key={preset.key}
                style={[styles.chip, scheduleKey === preset.key && styles.chipSelected]}
                onPress={() => setScheduleKey(preset.key)}
              >
                {preset.isExpress ? <Zap size={13} color={scheduleKey === preset.key ? colors.primaryPress : colors.muted} /> : null}
                <Text style={[styles.chipText, scheduleKey === preset.key && styles.chipTextSelected]}> {preset.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      {step === "where" ? (
        <Card style={{ gap: 12 }}>
          {addresses === undefined ? (
            <Skeleton height={70} borderRadius={13} />
          ) : addresses.length === 0 ? (
            <>
              <TextField label="Address label" placeholder="e.g. Home" value={newAddressLabel} onChangeText={setNewAddressLabel} />
              <TextField
                label="Full address"
                placeholder="House no, street, area"
                value={newAddressLine}
                onChangeText={setNewAddressLine}
                multiline
              />
            </>
          ) : (
            <View style={styles.chipRow}>
              {addresses.map((address) => (
                <Pressable
                  key={address.id}
                  style={[styles.chip, addressId === address.id && styles.chipSelected]}
                  onPress={() => setAddressId(address.id)}
                >
                  <Text style={[styles.chipText, addressId === address.id && styles.chipTextSelected]}>{address.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {selectedAddress ? <Text style={styles.addressLine}>{selectedAddress.line1}, {selectedAddress.neighborhood ?? selectedAddress.city}</Text> : null}
        </Card>
      ) : null}

      {step === "summary" ? (
        <Card>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{service.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>For</Text>
            <Text style={styles.summaryValue}>{selectedPatient?.is_self ? "Myself" : selectedPatient?.full_name ?? "—"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>When</Text>
            <Text style={styles.summaryValue}>{selectedPreset?.label ?? "—"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Address</Text>
            <Text style={styles.summaryValue}>{selectedAddress?.label ?? newAddressLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price</Text>
            <Text style={styles.summaryValue}>from ₹{service.price_from}</Text>
          </View>
        </Card>
      ) : null}

      {step === "summary" ? (
        <>
          <Text style={styles.payMethodsLabel}>Pay with</Text>
          <View style={{ gap: 9 }}>
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <Pressable
                  key={method.id}
                  disabled={!method.enabled}
                  style={[styles.payMethodRow, isSelected && styles.payMethodRowSelected, !method.enabled && styles.payMethodRowDisabled]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <View style={styles.payMethodIcon}>
                    <Icon size={18} color={method.enabled ? colors.primary : colors.muted} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payMethodName}>{method.name}</Text>
                    <Text style={styles.payMethodSub}>{method.sub}</Text>
                  </View>
                  {!method.enabled ? <StatusPill label="Coming soon" fg={colors.muted} bg={colors.chipNeutral ?? colors.border} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.payNote}>No payment is collected now — you&apos;ll pay your provider directly after the visit.</Text>
        </>
      ) : null}

      <View style={styles.footerRow}>
        {step !== "summary" ? (
          <Button label="Continue" disabled={!canGoNext} onPress={goNext} style={{ flex: 1 }} />
        ) : (
          <Button label={isSubmitting ? "Confirming..." : "Confirm booking"} disabled={isSubmitting} onPress={() => void handleConfirm()} style={{ flex: 1 }} />
        )}
      </View>
    </ScrollView>
  );
}
