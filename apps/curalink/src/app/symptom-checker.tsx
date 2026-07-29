import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchServicesByCategory } from "@curalink/api-client";
import { Skeleton, curalinkFonts, useTheme } from "@curalink/ui";

// Rule-based symptom -> specialist routing. Deliberately not "AI" -- there's
// no model behind this, just a fixed lookup table matching common symptoms
// to the closest of the 20 specialty consultations in the services catalog.
// Honest framing matters more than sounding impressive: this is a triage
// shortcut, not a diagnosis.
const SYMPTOMS: { label: string; icon: string; category: string; serviceMatch: string }[] = [
  { label: "Fever, cold or flu", icon: "🤒", category: "doctor", serviceMatch: "GP consultation" },
  { label: "Chest pain or palpitations", icon: "❤️", category: "doctor", serviceMatch: "Cardiology" },
  { label: "Bone, joint or sports injury", icon: "🦴", category: "doctor", serviceMatch: "Orthopedics" },
  { label: "Women's health or pregnancy", icon: "👩", category: "doctor", serviceMatch: "Gynecology" },
  { label: "Kidney problems", icon: "🫘", category: "doctor", serviceMatch: "Nephrology" },
  { label: "Headache, dizziness or numbness", icon: "🧠", category: "doctor", serviceMatch: "Neurology" },
  { label: "Stomach ache or digestion", icon: "🍽️", category: "doctor", serviceMatch: "Gastroenterology" },
  { label: "Breathing trouble or cough", icon: "🫁", category: "doctor", serviceMatch: "Pulmonology" },
  { label: "Ear, nose or throat issue", icon: "👂", category: "doctor", serviceMatch: "ENT" },
  { label: "Unexplained lump or cancer concern", icon: "🎗️", category: "doctor", serviceMatch: "Oncology" },
  { label: "Urinary or bladder issue", icon: "💧", category: "doctor", serviceMatch: "Urology" },
  { label: "Eye problem or vision change", icon: "👁️", category: "doctor", serviceMatch: "Ophthalmology" },
  { label: "My child is unwell", icon: "👶", category: "pediatric", serviceMatch: "Pediatric" },
  { label: "Fatigue, paleness or blood issue", icon: "🦠", category: "doctor", serviceMatch: "Hematology" },
  { label: "Skin rash, acne or hair loss", icon: "💫", category: "doctor", serviceMatch: "Dermatology" },
  { label: "Diabetes or thyroid concern", icon: "💡", category: "doctor", serviceMatch: "Endocrinology" },
  { label: "Joint swelling or autoimmune", icon: "🩸", category: "doctor", serviceMatch: "Rheumatology" },
  { label: "Before or after a surgery", icon: "🏥", category: "doctor", serviceMatch: "General Surgery" },
  { label: "Stress, anxiety or low mood", icon: "😊", category: "doctor", serviceMatch: "Psychiatry" },
  { label: "Tooth or gum pain", icon: "🦷", category: "doctor", serviceMatch: "Dentistry" },
  { label: "Not sure — general checkup", icon: "🩺", category: "doctor", serviceMatch: "GP consultation" },
];

export default function SymptomCheckerScreen() {
  const { colors } = useTheme();
  const [resolvingLabel, setResolvingLabel] = useState<string | null>(null);

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
        title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
        subtitle: { fontSize: 12.5, color: colors.muted2, lineHeight: 18 },
        grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
        chip: {
          width: "47%",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border2,
          borderRadius: 16,
          padding: 14,
        },
        chipDisabled: { opacity: 0.5 },
        chipIcon: { fontSize: 20 },
        chipLabel: { flex: 1, fontSize: 12.5, fontWeight: "600", color: colors.ink, lineHeight: 17 },
        disclaimer: {
          fontSize: 11,
          color: colors.muted2,
          textAlign: "center",
          marginTop: 8,
          lineHeight: 16,
        },
      }),
    [colors],
  );

  // One query per category actually used below, cached independently so
  // tapping a chip doesn't refetch every time.
  const { data: doctorServices } = useQuery({
    queryKey: ["servicesByCategory", "doctor"],
    queryFn: () => fetchServicesByCategory("doctor"),
  });
  const { data: pediatricServices } = useQuery({
    queryKey: ["servicesByCategory", "pediatric"],
    queryFn: () => fetchServicesByCategory("pediatric"),
  });

  const servicesByCategory: Record<string, typeof doctorServices> = {
    doctor: doctorServices,
    pediatric: pediatricServices,
  };

  async function handlePick(symptom: (typeof SYMPTOMS)[number]) {
    setResolvingLabel(symptom.label);
    try {
      const services = servicesByCategory[symptom.category];
      const match = services?.find((s) => s.name.toLowerCase().includes(symptom.serviceMatch.toLowerCase()));
      if (match) {
        router.push({ pathname: "/booking/new", params: { serviceId: match.id } });
      } else {
        router.push({ pathname: "/category/[category]", params: { category: symptom.category } });
      }
    } finally {
      setResolvingLabel(null);
    }
  }

  const isLoading = doctorServices === undefined || pediatricServices === undefined;

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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Symptom Checker</Text>
          <Text style={styles.subtitle}>Tell us what&apos;s wrong, we&apos;ll pick the right specialist for you.</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={54} borderRadius={16} delay={i * 60} />
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {SYMPTOMS.map((symptom) => (
            <Pressable
              key={symptom.label}
              style={[styles.chip, resolvingLabel === symptom.label && styles.chipDisabled]}
              disabled={Boolean(resolvingLabel)}
              onPress={() => void handlePick(symptom)}
            >
              <Text style={styles.chipIcon}>{symptom.icon}</Text>
              <Text style={styles.chipLabel}>{symptom.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>
        This is a quick guide to help you book the right specialist — not a medical diagnosis. In an emergency, use SOS instead.
      </Text>
    </ScrollView>
  );
}
