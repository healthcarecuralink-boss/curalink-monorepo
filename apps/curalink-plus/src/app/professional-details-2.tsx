import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, FileText, IdCard, MapPinned, ShieldCheck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { updateProfessionalCredentials, useSessionStore, type ProfessionalRole } from "@curalink/api-client";
import { Button, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";


const documentSlots = [
  { key: "license", label: "Professional license", Icon: FileText, tint: "#E8F5F0", fg: "#0F7A5E" },
  { key: "id", label: "Government ID proof", Icon: IdCard, tint: "#EAF1FE", fg: "#3B82F6" },
  { key: "bg", label: "Police background check", Icon: ShieldCheck, tint: "#FEF3E2", fg: "#E89530" },
  { key: "addr", label: "Address proof", Icon: MapPinned, tint: "#F1EBFD", fg: "#8B5CF6" },
] as const;

// Upload state is visual-only for now -- real Supabase Storage wiring
// (camera-roll permissions, bucket setup) is deferred; this still records a
// docs[] entry so professional_credentials reflects what was "submitted".
export default function ProfessionalDetailsStep2() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 70 },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 2 },
    step: { fontSize: 11, fontWeight: "700", color: colors.muted, marginTop: 8 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink, marginTop: 6 },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 4 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
    slot: {
      width: "47%",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
      backgroundColor: colors.surface,
    },
    iconChip: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    slotLabel: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 13, color: colors.ink },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
    statusText: { fontSize: 11, color: colors.muted },
    cta: { marginTop: 28 },
        }),
      [colors],
    );
  const { role } = useLocalSearchParams<{ role: ProfessionalRole }>();
  const session = useSessionStore((s) => s.session);
  const accent = roleAccents[role];
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allUploaded = documentSlots.every((slot) => uploaded[slot.key]);

  async function handleContinue() {
    const userId = session?.user.id;
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await updateProfessionalCredentials(userId, {
        docs: documentSlots.map((slot) => ({ type: slot.key, status: "pending_review" })),
      });
      router.push({ pathname: "/bank-details", params: { role } });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backButton}
        hitSlop={8}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
      </Pressable>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "100%", backgroundColor: accent }]} />
      </View>
      <Text style={styles.step}>2/2</Text>
      <Text style={styles.title}>Upload documents</Text>
      <Text style={styles.subtitle}>Clear photos or scans. We verify within 24 hours.</Text>

      <View style={styles.grid}>
        {documentSlots.map((slot) => {
          const isUploaded = uploaded[slot.key];
          return (
            <Pressable
              key={slot.key}
              style={[styles.slot, isUploaded && { borderStyle: "solid", borderColor: accent }]}
              onPress={() => setUploaded((prev) => ({ ...prev, [slot.key]: !prev[slot.key] }))}
            >
              <View style={[styles.iconChip, { backgroundColor: slot.tint }]}>
                <slot.Icon size={20} color={slot.fg} strokeWidth={1.8} />
              </View>
              <Text style={styles.slotLabel}>{slot.label}</Text>
              <View style={styles.statusRow}>
                {isUploaded ? <Check size={13} color={accent} /> : null}
                <Text style={[styles.statusText, isUploaded && { color: accent }]}>
                  {isUploaded ? "Uploaded — pending review" : "Tap to upload"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={isSubmitting ? "Saving..." : "Continue"}
        disabled={!allUploaded || isSubmitting}
        onPress={() => void handleContinue()}
        style={styles.cta}
      />
    </View>
  );
}
