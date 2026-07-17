import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Check, Heart, Shield, Siren, Stethoscope, Store, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ProfessionalRole } from "@curalink/api-client";
import { Button, curalinkPlusFonts, roleAccents, roleTints, useTheme } from "@curalink/ui";


interface RoleOption {
  key: ProfessionalRole;
  label: string;
  description: string;
  Icon: typeof Heart;
}

const roles: RoleOption[] = [
  { key: "nurse", label: "Nurse", description: "Home visits — injections, dressing, elder care", Icon: Heart },
  { key: "doctor", label: "Doctor", description: "Teleconsults, prescriptions, home visits", Icon: Stethoscope },
  { key: "vet", label: "Veterinarian", description: "Home visits for pets across Hyderabad", Icon: Shield },
  { key: "admin", label: "Partner Admin", description: "Manage a team of professionals", Icon: Users },
  { key: "pharmacy", label: "Pharmacy Partner", description: "Fulfill medicine orders for pickup or delivery", Icon: Store },
  { key: "ambulance", label: "Ambulance Partner", description: "Respond to emergency transport requests", Icon: Siren },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 80, paddingHorizontal: 20, paddingBottom: 60 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 24, color: colors.ink },
    subtitle: { fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 21 },
    list: { marginTop: 24, gap: 10 },
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
  const [selected, setSelected] = useState<ProfessionalRole | null>(null);
  const selectedOption = roles.find((r) => r.key === selected);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome to CuraLink Plus</Text>
      <Text style={styles.subtitle}>The professional app for CuraLink&apos;s care team. Tell us who you are.</Text>

      <View style={styles.list}>
        {roles.map((role) => {
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
        label={selectedOption ? `Continue as ${selectedOption.label}` : "Select a role to continue"}
        disabled={!selectedOption}
        onPress={() => router.push({ pathname: "/login", params: { role: selected } })}
        style={styles.cta}
      />
    </ScrollView>
  );
}
