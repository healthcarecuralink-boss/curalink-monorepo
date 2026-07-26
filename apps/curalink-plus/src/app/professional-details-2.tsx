import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { ArrowLeft, Check, FileText, IdCard, MapPinned, ShieldCheck, X } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import {
  updateProfessionalCredentials,
  uploadProfessionalDocument,
  useSessionStore,
  type ProfessionalRole,
} from "@curalink/api-client";
import { Button, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";


const documentSlots = [
  { key: "license", label: "Professional license", Icon: FileText, tint: "#E8F5F0", fg: "#0F7A5E" },
  { key: "id", label: "Government ID proof", Icon: IdCard, tint: "#EAF1FE", fg: "#3B82F6" },
  { key: "bg", label: "Police background check", Icon: ShieldCheck, tint: "#FEF3E2", fg: "#E89530" },
  { key: "addr", label: "Address proof", Icon: MapPinned, tint: "#F1EBFD", fg: "#8B5CF6" },
] as const;

type SlotState = { status: "idle" | "uploading" | "uploaded" | "error"; path?: string; error?: string };

// Tapping a slot opens the real system file/photo picker and uploads the
// chosen file to the professional-documents Storage bucket -- previously
// this just toggled a local boolean with nothing behind it (see git history
// for the removed "visual-only" version), so a "submitted" document had no
// actual file for staff to review.
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
    statusTextError: { color: colors.error },
    cta: { marginTop: 28 },
        }),
      [colors],
    );
  const { role } = useLocalSearchParams<{ role: ProfessionalRole }>();
  const session = useSessionStore((s) => s.session);
  const accent = roleAccents[role];
  const [slots, setSlots] = useState<Record<string, SlotState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Agency owners (admin) are lighter-weight to verify than a licensed
  // nurse/doctor/vet -- CuraLink staff still reviews them, but documents
  // aren't required to move on. Every other role still needs all four.
  const docsRequired = role !== "admin";
  const allUploaded = documentSlots.every((slot) => slots[slot.key]?.status === "uploaded");

  async function handlePickDocument(slotKey: string) {
    const userId = session?.user.id;
    if (!userId) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    setSlots((prev) => ({ ...prev, [slotKey]: { status: "uploading" } }));
    try {
      const path = await uploadProfessionalDocument(userId, slotKey, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });
      setSlots((prev) => ({ ...prev, [slotKey]: { status: "uploaded", path } }));
    } catch (err) {
      setSlots((prev) => ({
        ...prev,
        [slotKey]: { status: "error", error: err instanceof Error ? err.message : "Upload failed" },
      }));
    }
  }
  const canContinue = !docsRequired || allUploaded;

  async function handleContinue() {
    const userId = session?.user.id;
    if (!userId) return;
    setIsSubmitting(true);
    try {
      const uploadedSlots = documentSlots.filter((slot) => slots[slot.key]?.status === "uploaded");
      if (uploadedSlots.length > 0) {
        await updateProfessionalCredentials(userId, {
          docs: uploadedSlots.map((slot) => ({
            type: slot.key,
            status: "pending_review",
            path: slots[slot.key]?.path,
          })),
        });
      }
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
      <Text style={styles.subtitle}>
        {docsRequired ? "Clear photos or scans. We verify within 24 hours." : "Optional for agencies — add them now or skip and upload later."}
      </Text>

      <View style={styles.grid}>
        {documentSlots.map((slot) => {
          const state = slots[slot.key] ?? { status: "idle" as const };
          const isUploaded = state.status === "uploaded";
          const isUploading = state.status === "uploading";
          const isError = state.status === "error";
          return (
            <Pressable
              key={slot.key}
              style={[styles.slot, isUploaded && { borderStyle: "solid", borderColor: accent }]}
              disabled={isUploading}
              onPress={() => void handlePickDocument(slot.key)}
            >
              <View style={[styles.iconChip, { backgroundColor: slot.tint }]}>
                <slot.Icon size={20} color={slot.fg} strokeWidth={1.8} />
              </View>
              <Text style={styles.slotLabel}>{slot.label}</Text>
              <View style={styles.statusRow}>
                {isUploading ? <ActivityIndicator size="small" color={accent} /> : null}
                {isUploaded ? <Check size={13} color={accent} /> : null}
                {isError ? <X size={13} color={colors.error} /> : null}
                <Text
                  style={[
                    styles.statusText,
                    isUploaded && { color: accent },
                    isError && styles.statusTextError,
                  ]}
                >
                  {isUploading
                    ? "Uploading…"
                    : isUploaded
                      ? "Uploaded — pending review"
                      : isError
                        ? (state.error ?? "Upload failed — tap to retry")
                        : "Tap to upload"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={isSubmitting ? "Saving..." : !docsRequired && !allUploaded ? "Skip for now" : "Continue"}
        disabled={!canContinue || isSubmitting}
        onPress={() => void handleContinue()}
        style={styles.cta}
      />
    </View>
  );
}
