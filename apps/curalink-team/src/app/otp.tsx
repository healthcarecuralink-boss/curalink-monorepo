import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { getErrorMessage, verifyEmailOtp } from "@curalink/api-client";
import { Button, TextField, useTheme } from "@curalink/ui";

export default function OtpScreen() {
  const { colors } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyEmailOtp(email ?? "", code);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
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
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>
      <View style={styles.form}>
        <TextField label="Code" placeholder="123456" keyboardType="number-pad" value={code} onChangeText={setCode} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={isSubmitting ? "Verifying..." : "Verify"} disabled={isSubmitting || code.length < 6} onPress={() => void handleVerify()} />
      </View>
    </View>
  );
}
