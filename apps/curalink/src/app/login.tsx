import { useState, useMemo } from "react";
import { Link, router } from "expo-router";
import { HeartPulse } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { getErrorMessage } from "@curalink/api-client";
import { Button, TextField, curalinkFonts, useTheme } from "@curalink/ui";
import { sendMsg91Otp } from "../utils/msg91Widget";


// Adapted from the prototype's email+password "Login" screen to phone-only:
// the README's Auth step is explicit that phone OTP (via Supabase Auth +
// MSG91) is the actual mechanism, so this screen's only real credential is
// the phone number -- there's no password to check against.
export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 24,
      paddingTop: 100,
    },
    iconChip: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: {
      fontFamily: curalinkFonts.heading,
      fontSize: 27,
      color: colors.ink,
    },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 6,
    },
    form: {
      marginTop: 32,
      gap: 16,
    },
    error: {
      color: colors.error,
      fontSize: 12.5,
    },
    footerLink: {
      marginTop: 24,
      alignSelf: "center",
      fontSize: 13.5,
      color: colors.muted,
    },
    footerLinkAccent: {
      color: colors.primary,
      fontWeight: "700",
    },
        }),
      [colors],
    );
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setIsSubmitting(true);
    try {
      const reqId = await sendMsg91Otp(phone);
      router.push({ pathname: "/otp", params: { phone, reqId } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconChip}>
        <HeartPulse size={28} color="#FFFFFF" strokeWidth={2} />
      </View>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to book care for your family.</Text>

      <View style={styles.form}>
        <TextField
          label="Mobile number"
          placeholder="98480 12345"
          phonePrefix="+91"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={isSubmitting ? "Sending..." : "Send OTP"} disabled={isSubmitting} onPress={() => void handleContinue()} />
      </View>

      <Link href="/signup" style={styles.footerLink}>
        New to CuraLink? <Text style={styles.footerLinkAccent}>Create account</Text>
      </Link>
    </View>
  );
}
