import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { getErrorMessage, sendEmailOtp, signInWithPhonePassword } from "@curalink/api-client";
import { Button, TextField, useTheme } from "@curalink/ui";

// Dev-only bypass: the seeded "Test Admin" account is also flagged
// is_curalink_staff (see the flag_dev_admin_as_staff migration), so QA can
// reach the verification queue without a real staff email inbox.
// __DEV__-gated, stripped from release builds.
const DEV_STAFF_ACCOUNT = { phone: "1234500003", password: "TestAdmin@123" };

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDevSubmitting, setIsDevSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    setError(null);
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await sendEmailOtp(email.trim());
      router.push({ pathname: "/otp", params: { email: email.trim() } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDevSignIn() {
    setError(null);
    setIsDevSubmitting(true);
    try {
      await signInWithPhonePassword(DEV_STAFF_ACCOUNT.phone, DEV_STAFF_ACCOUNT.password);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDevSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    subtitle: { fontSize: 13.5, color: colors.muted, textAlign: "center" },
    error: { fontSize: 12.5, color: colors.error, textAlign: "center" },
    form: { width: "100%", gap: 12 },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CuraLink Team</Text>
      <Text style={styles.subtitle}>Internal verification tools -- staff only.</Text>
      <View style={styles.form}>
        <TextField
          label="Email"
          placeholder="you@curalink.co.in"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={isSubmitting ? "Sending..." : "Email me a code"} disabled={isSubmitting || !email.trim()} onPress={() => void handleSendCode()} />
        {__DEV__ ? (
          <Button
            label={isDevSubmitting ? "Signing in..." : "Dev: sign in as staff"}
            variant="secondary"
            disabled={isDevSubmitting}
            onPress={() => void handleDevSignIn()}
          />
        ) : null}
      </View>
    </View>
  );
}
