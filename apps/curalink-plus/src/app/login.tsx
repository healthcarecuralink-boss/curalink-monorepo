import { useState, useMemo } from "react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Stethoscope } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { getErrorMessage, type ProfessionalRole } from "@curalink/api-client";
import { Button, TextField, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";
import { sendMsg91Otp } from "../utils/msg91Widget";


const roleLabels: Record<ProfessionalRole, string> = {
  nurse: "Nurse",
  doctor: "Doctor",
  vet: "Veterinarian",
  admin: "Partner Admin",
  pharmacy: "Pharmacy Partner",
  ambulance: "Ambulance Partner",
};

// Adapted from the prototype's email+password "Login" to phone-only -- see
// the CuraLink app's login.tsx for why (phone OTP is the real credential).
export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 100 },
    iconChip: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 18 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 24, color: colors.ink },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 4 },
    form: { marginTop: 28, gap: 16 },
    error: { color: colors.error, fontSize: 12.5 },
    footerLink: { marginTop: 22, alignSelf: "center", fontSize: 13, color: colors.muted },
    footerLinkAccent: { color: colors.primary, fontWeight: "700" },
        }),
      [colors],
    );
  const { role } = useLocalSearchParams<{ role?: ProfessionalRole }>();
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roleLabel = role ? roleLabels[role] : undefined;
  const accent = role ? roleAccents[role] : colors.primary;

  async function handleContinue() {
    setError(null);
    setIsSubmitting(true);
    try {
      const reqId = await sendMsg91Otp(phone);
      router.push({ pathname: "/otp", params: { phone, reqId, role } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconChip, { backgroundColor: accent }]}>
        <Stethoscope size={24} color="#FFFFFF" strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>{roleLabel ? `${roleLabel} · ` : ""}CuraLink partner network</Text>

      <View style={styles.form}>
        <TextField
          label="Mobile number"
          placeholder="98481 22334"
          phonePrefix="+91"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={isSubmitting ? "Sending..." : "Send OTP"} disabled={isSubmitting} onPress={() => void handleContinue()} />
      </View>

      <Link href={{ pathname: "/signup", params: { role } }} style={styles.footerLink}>
        New professional? <Text style={styles.footerLinkAccent}>Apply to join</Text>
      </Link>
    </View>
  );
}
