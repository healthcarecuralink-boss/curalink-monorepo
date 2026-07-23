import { useMemo, useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, Check, Heart, Shield, Siren, Stethoscope, Store, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { requestRole, useSessionStore, type ProfessionalRole } from "@curalink/api-client";
import { Button, curalinkPlusFonts, roleAccents, roleTints, useTheme } from "@curalink/ui";

interface RoleOption {
  key: ProfessionalRole;
  label: string;
  description: string;
  Icon: typeof Heart;
}

const allRoles: RoleOption[] = [
  { key: "nurse", label: "Nurse", description: "Home visits — injections, dressing, elder care", Icon: Heart },
  { key: "doctor", label: "Doctor", description: "Teleconsults, prescriptions, home visits", Icon: Stethoscope },
  { key: "vet", label: "Veterinarian", description: "Home visits for pets across Hyderabad", Icon: Shield },
  { key: "admin", label: "Partner Admin", description: "Manage a team of professionals", Icon: Users },
  { key: "pharmacy", label: "Pharmacy Partner", description: "Fulfill medicine orders for pickup or delivery", Icon: Store },
  { key: "ambulance", label: "Ambulance Partner", description: "Respond to emergency transport requests", Icon: Siren },
];

// Role picker for new applicants. Selecting a role normally hands off to the
// /login -> /otp -> /professional-details-1 pipeline, which already knows
// how to turn a verified, role-tagged sign-in into an application (see
// otp.tsx's requestRole call for a first-time applicant). But a Google
// sign-in can also land here already authenticated (auth-callback.tsx sends
// a brand-new Google user here since it has no role to pass along) -- in
// that case there's no OTP left to do, so this screen calls requestRole
// itself and skips straight to professional-details-1.
export default function SignupScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60 },
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
        subtitle: { fontSize: 13, color: colors.muted, marginTop: 12, lineHeight: 19 },
        list: { marginTop: 20, gap: 10 },
        card: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: 13,
          padding: 14,
        },
        iconChip: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
        cardLabel: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14.5, color: colors.ink },
        cardDescription: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
        radio: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1.5,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        cta: { marginTop: 24 },
      }),
    [colors],
  );
  const session = useSessionStore((s) => s.session);
  const [selected, setSelected] = useState<ProfessionalRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedOption = allRoles.find((r) => r.key === selected);

  async function handleContinue() {
    if (!selected) return;
    if (session) {
      setIsSubmitting(true);
      try {
        await requestRole(selected);
        router.replace({ pathname: "/professional-details-1", params: { role: selected } });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    router.push({ pathname: "/login", params: { role: selected } });
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
        <Text style={styles.title}>Apply to join</Text>
      </View>
      <Text style={styles.subtitle}>Choose your professional type to get started.</Text>

      <View style={styles.list}>
        {allRoles.map((role) => {
          const isSelected = role.key === selected;
          const accent = roleAccents[role.key];
          const tint = roleTints[role.key];
          return (
            <Pressable
              key={role.key}
              style={[styles.card, isSelected && { borderColor: accent }]}
              onPress={() => setSelected(role.key)}
            >
              <View style={[styles.iconChip, { backgroundColor: tint }]}>
                <role.Icon size={20} color={accent} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{role.label}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </View>
              <View style={[styles.radio, isSelected && { backgroundColor: accent, borderColor: accent }]}>
                {isSelected ? <Check size={12} color="#FFFFFF" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={
          isSubmitting ? "Submitting..." : selectedOption ? `Continue as ${selectedOption.label}` : "Select a role to continue"
        }
        disabled={!selectedOption || isSubmitting}
        onPress={() => void handleContinue()}
        style={styles.cta}
      />
    </ScrollView>
  );
}
