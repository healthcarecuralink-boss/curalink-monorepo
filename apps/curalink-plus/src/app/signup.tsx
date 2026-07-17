import { useState, useMemo } from "react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getErrorMessage, type ProfessionalRole } from "@curalink/api-client";
import { Button, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";
import { sendMsg91Otp } from "../utils/msg91Widget";


const roleLabels: Record<ProfessionalRole, string> = {
  nurse: "Nurse",
  doctor: "Doctor",
  vet: "Veterinarian",
  admin: "Partner Admin",
  pharmacy: "Pharmacy Partner",
  ambulance: "Ambulance Partner",
};

export default function SignupScreen() {
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
      marginBottom: 22,
    },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 24, color: colors.ink },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 4 },
    form: { marginTop: 26, gap: 16 },
    error: { color: colors.error, fontSize: 12.5 },
    footerLink: { marginTop: 22, alignSelf: "center", fontSize: 13, color: colors.muted },
    footerLinkAccent: { color: colors.primary, fontWeight: "700" },
    consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    consentLabel: { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 16.5 },
    consentLink: { color: colors.primary, fontWeight: "700" },
        }),
      [colors],
    );
  const { role } = useLocalSearchParams<{ role?: ProfessionalRole }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roleLabel = role ? roleLabels[role] : "Professional";

  async function handleContinue() {
    setError(null);
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!consentGiven) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setIsSubmitting(true);
    try {
      const reqId = await sendMsg91Otp(phone);
      router.push({ pathname: "/otp", params: { phone, reqId, name, role, consent: "1" } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
        <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
      </Pressable>

      <Text style={styles.title}>Apply as {roleLabel}</Text>
      <Text style={styles.subtitle}>Basic details first — credentials next.</Text>

      <View style={styles.form}>
        <TextField label="Full name" placeholder="Priya Sharma" value={name} onChangeText={setName} />
        <TextField
          label="Mobile number"
          placeholder="98481 22334"
          phonePrefix="+91"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Pressable
          style={styles.consentRow}
          onPress={() => setConsentGiven((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consentGiven }}
          accessibilityLabel="Accept Terms of Service and Privacy Policy"
        >
          <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
            {consentGiven ? <Check size={13} color="#fff" strokeWidth={3} /> : null}
          </View>
          <Text style={styles.consentLabel}>
            I agree to the{" "}
            <Text style={styles.consentLink} onPress={() => router.push("/terms")}>
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text style={styles.consentLink} onPress={() => router.push("/privacy")}>
              Privacy Policy
            </Text>
            .
          </Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={isSubmitting ? "Sending..." : "Continue"} disabled={isSubmitting} onPress={() => void handleContinue()} />
      </View>

      <Link href={{ pathname: "/login", params: { role } }} style={styles.footerLink}>
        Already registered? <Text style={styles.footerLinkAccent}>Sign in</Text>
      </Link>
    </View>
  );
}
