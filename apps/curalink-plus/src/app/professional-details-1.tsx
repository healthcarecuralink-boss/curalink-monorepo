import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { updateProfessionalCredentials, useSessionStore, type ProfessionalRole } from "@curalink/api-client";
import { Button, TextField, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";


const credentialCopy: Record<ProfessionalRole, { label: string; example: string; blurb: string }> = {
  nurse: { label: "Nursing qualification", example: "GNM, BSc Nursing", blurb: "Tell us about your nursing background." },
  doctor: { label: "Medical qualification", example: "MBBS, MD (General Medicine)", blurb: "Tell us about your medical qualifications." },
  vet: { label: "Veterinary qualification", example: "BVSc & AH", blurb: "Tell us about your veterinary background." },
  admin: { label: "Agency name", example: "Reddy Home Care Services", blurb: "Tell us about the agency you run." },
  pharmacy: { label: "Pharmacy / store name", example: "Apollo Pharmacy — Kondapur", blurb: "Tell us about your pharmacy." },
  ambulance: { label: "Ambulance service name", example: "Rapid Response Ambulance Services", blurb: "Tell us about your ambulance fleet." },
};

const specializationsByRole: Record<ProfessionalRole, string[]> = {
  nurse: ["Elder care", "Wound care", "ICU/critical care", "Pediatric", "Post-op", "Vaccination"],
  doctor: ["General medicine", "Pediatrics", "Orthopedics", "Cardiology", "Dermatology"],
  vet: ["Small animals", "Large animals", "Vaccination", "Surgery follow-up"],
  pharmacy: ["Home delivery", "Cold-chain storage", "Compounding", "24/7 dispensing"],
  ambulance: ["Basic Life Support", "Advanced Life Support", "Neonatal transport", "Mortuary transport"],
  admin: [],
};

export default function ProfessionalDetailsStep1() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 70 },
    progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 2 },
    step: { fontSize: 11, fontWeight: "700", color: colors.muted, marginTop: 8 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink, marginTop: 6 },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 4 },
    form: { marginTop: 24, gap: 16 },
    fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted, marginBottom: 8 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    tagText: { fontSize: 12, fontWeight: "600", color: colors.ink },
    tagTextSelected: { color: "#FFFFFF" },
    cta: { marginTop: 28 },
        }),
      [colors],
    );
  const { role } = useLocalSearchParams<{ role: ProfessionalRole }>();
  const session = useSessionStore((s) => s.session);
  const copy = credentialCopy[role];
  const specializationOptions = specializationsByRole[role];
  const accent = roleAccents[role];

  const [qualification, setQualification] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleSpecialization(spec: string) {
    setSpecializations((prev) => (prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]));
  }

  async function handleContinue() {
    const userId = session?.user.id;
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await updateProfessionalCredentials(userId, {
        credentials: [{ qualification, registration_number: registrationNumber, years_experience: yearsExperience, specializations }],
      });
      router.push({ pathname: "/professional-details-2", params: { role } });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "50%", backgroundColor: accent }]} />
      </View>
      <Text style={styles.step}>1/2</Text>
      <Text style={styles.title}>Your credentials</Text>
      <Text style={styles.subtitle}>{copy.blurb}</Text>

      <View style={styles.form}>
        <TextField label={copy.label} placeholder={copy.example} value={qualification} onChangeText={setQualification} />
        <TextField
          label="Registration / license number"
          placeholder="TSNC/RN/88213"
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
        />
        <TextField
          label="Years of experience"
          placeholder="6"
          keyboardType="number-pad"
          value={yearsExperience}
          onChangeText={setYearsExperience}
        />

        {specializationOptions.length > 0 ? (
          <View>
            <Text style={styles.fieldLabel}>Specializations</Text>
            <View style={styles.tagRow}>
              {specializationOptions.map((spec) => {
                const isSelected = specializations.includes(spec);
                return (
                  <Pressable
                    key={spec}
                    style={[styles.tag, isSelected && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => toggleSpecialization(spec)}
                  >
                    {isSelected ? <Check size={12} color="#FFFFFF" /> : null}
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{spec}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <Button label={isSubmitting ? "Saving..." : "Continue"} disabled={isSubmitting} onPress={() => void handleContinue()} style={styles.cta} />
    </View>
  );
}
