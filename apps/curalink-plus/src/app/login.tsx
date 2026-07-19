import { useState, useMemo } from "react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Stethoscope } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { getErrorMessage, signInWithPhonePassword, type ProfessionalRole } from "@curalink/api-client";
import { Button, TextField, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";
import { sendMsg91Otp } from "../utils/msg91Widget";

// Dev-only bypass: one seeded account per role (see supabase/seed.sql) so QA
// can get past MSG91 OTP delivery without a real phone. __DEV__-gated so
// it's stripped from release builds -- never a valid path in production.
const DEV_TEST_ACCOUNTS: Record<ProfessionalRole, { phone: string; password: string }> = {
  nurse: { phone: "1234500000", password: "TestNurse@123" },
  doctor: { phone: "1234500001", password: "TestDoctor@123" },
  vet: { phone: "1234500002", password: "TestVet@123" },
  admin: { phone: "1234500003", password: "TestAdmin@123" },
  pharmacy: { phone: "1234500004", password: "TestPharmacy@123" },
  ambulance: { phone: "1234500005", password: "TestAmbulance@123" },
};


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
    devPanel: {
      marginTop: 28,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    devPanelTitle: { fontSize: 11.5, fontWeight: "700", color: colors.muted, marginBottom: 10 },
    devPanelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    devPanelButton: { height: 40, paddingHorizontal: 14 },
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

  async function handleDevTestLogin(testRole: ProfessionalRole) {
    setError(null);
    setIsSubmitting(true);
    try {
      const { phone: testPhone, password } = DEV_TEST_ACCOUNTS[testRole];
      await signInWithPhonePassword(testPhone, password);
      router.replace("/(tabs)/home");
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

      {__DEV__ ? (
        <View style={styles.devPanel}>
          <Text style={styles.devPanelTitle}>Dev: skip OTP, sign in as</Text>
          <View style={styles.devPanelGrid}>
            {(Object.keys(DEV_TEST_ACCOUNTS) as ProfessionalRole[]).map((testRole) => (
              <Button
                key={testRole}
                label={roleLabels[testRole]}
                variant="secondary"
                size="default"
                disabled={isSubmitting}
                onPress={() => void handleDevTestLogin(testRole)}
                style={styles.devPanelButton}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Link href={{ pathname: "/signup", params: { role } }} style={styles.footerLink}>
        New professional? <Text style={styles.footerLinkAccent}>Apply to join</Text>
      </Link>
    </View>
  );
}
