import { useState, useMemo } from "react";
import { router } from "expo-router";
import { ChevronDown, MessageCircleHeart, Siren } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSessionStore, type ProfessionalRole } from "@curalink/api-client";
import { curalinkPlusFonts, roleAccents, roleTints, useTheme } from "@curalink/ui";
import { AdminHome } from "../../components/homes/AdminHome";
import { AmbulanceHome } from "../../components/homes/AmbulanceHome";
import { DoctorHome } from "../../components/homes/DoctorHome";
import { NurseVetHome } from "../../components/homes/NurseVetHome";
import { PharmacyHome } from "../../components/homes/PharmacyHome";


const roleLabels: Record<ProfessionalRole, string> = {
  nurse: "Nurse",
  doctor: "Doctor",
  vet: "Veterinarian",
  admin: "Partner Admin",
  pharmacy: "Pharmacy Partner",
  ambulance: "Ambulance Partner",
};

const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Welcome back";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Welcome back";
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
    header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    greeting: { fontFamily: curalinkPlusFonts.heading, fontSize: 19, color: colors.ink },
    date: { fontSize: 12, color: colors.muted, marginTop: 3 },
    headerButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
    sosButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 99,
      backgroundColor: colors.error,
    },
    sosButtonText: { fontSize: 12.5, fontWeight: "800", color: "#FFFFFF" },
    rolePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99 },
    rolePillText: { fontSize: 12, fontWeight: "700" },
    assistantBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
    },
    assistantIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#E8F5F0", alignItems: "center", justifyContent: "center" },
    assistantTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 13.5, color: colors.ink },
    assistantSubtitle: { fontSize: 11, color: colors.muted, marginTop: 2 },
    switcherSheet: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 8,
      gap: 2,
    },
    switcherRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10 },
    switcherDot: { width: 9, height: 9, borderRadius: 5 },
    switcherLabel: { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.ink },
        }),
      [colors],
    );
  const profile = useSessionStore((s) => s.profile);
  const activeRole = useSessionStore((s) => s.activeRole);
  const setActiveRole = useSessionStore((s) => s.setActiveRole);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const roles = profile?.roles ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.headerButtons}>
          {activeRole && activeRole !== "admin" ? (
            <Pressable style={styles.sosButton} onPress={() => router.push("/sos")}>
              <Siren size={14} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.sosButtonText}>SOS</Text>
            </Pressable>
          ) : null}
          {activeRole ? (
            <Pressable
              style={[styles.rolePill, { backgroundColor: roleTints[activeRole] }]}
              onPress={() => setSwitcherOpen((v) => !v)}
            >
              <Text style={[styles.rolePillText, { color: roleAccents[activeRole] }]}>{roleLabels[activeRole]}</Text>
              <ChevronDown size={14} color={roleAccents[activeRole]} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Pressable style={styles.assistantBanner} onPress={() => router.push("/cura-assistant")}>
        <View style={styles.assistantIcon}>
          <MessageCircleHeart size={18} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.assistantTitle}>Ask Cura Assistant</Text>
          <Text style={styles.assistantSubtitle}>Questions about your workflow, visits, or account</Text>
        </View>
      </Pressable>

      {switcherOpen && roles.length > 1 ? (
        <View style={styles.switcherSheet}>
          {roles.map((role) => (
            <Pressable
              key={role}
              style={styles.switcherRow}
              onPress={() => {
                setActiveRole(role as ProfessionalRole);
                setSwitcherOpen(false);
              }}
            >
              <View style={[styles.switcherDot, { backgroundColor: roleAccents[role as ProfessionalRole] }]} />
              <Text style={styles.switcherLabel}>{roleLabels[role as ProfessionalRole]}</Text>
              {role === activeRole ? <Text style={{ color: colors.primary, fontWeight: "700" }}>✓</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {activeRole === "nurse" || activeRole === "vet" ? <NurseVetHome role={activeRole} /> : null}
      {activeRole === "doctor" ? <DoctorHome /> : null}
      {activeRole === "pharmacy" ? <PharmacyHome /> : null}
      {activeRole === "ambulance" ? <AmbulanceHome /> : null}
      {activeRole === "admin" ? <AdminHome /> : null}
    </ScrollView>
  );
}
