import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Heart, Shield, Siren, Stethoscope, Store, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchProfessionalCredentials, requestRole, useSessionStore, type ProfessionalRole } from "@curalink/api-client";
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

export default function AddRoleScreen() {
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
    emptyText: { fontSize: 13, color: colors.muted, marginTop: 24, textAlign: "center" },
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
  const profile = useSessionStore((s) => s.profile);
  const session = useSessionStore((s) => s.session);
  const [selected, setSelected] = useState<ProfessionalRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = session?.user.id;
  const { data: credentials } = useQuery({
    queryKey: ["professionalCredentials", userId],
    queryFn: () => fetchProfessionalCredentials(userId as string),
    enabled: Boolean(userId),
  });

  const heldRoles = new Set(profile?.roles ?? []);
  const pendingRoles = credentials?.pending_roles ?? [];
  const availableRoles = allRoles.filter((r) => !heldRoles.has(r.key) && !pendingRoles.includes(r.key));
  const selectedOption = availableRoles.find((r) => r.key === selected);

  async function handleSubmit() {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await requestRole(selected);
      router.replace({ pathname: "/verification-pending", params: { role: selected } });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Add another role</Text>
      </View>
      <Text style={styles.subtitle}>Same bank details and documents — no re-onboarding needed.</Text>

      {availableRoles.length === 0 ? (
        <Text style={styles.emptyText}>You already hold or have applied for every available role.</Text>
      ) : (
        <View style={styles.list}>
          {availableRoles.map((role) => {
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
      )}

      <Button
        label={
          isSubmitting ? "Submitting..." : selectedOption ? `Apply as ${selectedOption.label}` : "Select a role to continue"
        }
        disabled={!selectedOption || isSubmitting}
        onPress={() => void handleSubmit()}
        style={styles.cta}
      />
    </ScrollView>
  );
}
