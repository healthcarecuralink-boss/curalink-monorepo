import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Check, HeartPulse } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getErrorMessage, sendEmailOtp, sendPhoneOtp, signInWithGoogle, useSessionStore } from "@curalink/api-client";
import { Button, TextField, curalinkFonts, useTheme } from "@curalink/ui";

// Phone (WhatsApp) OTP is temporarily hidden while Meta Business Verification is
// pending -- email OTP is the interim login. Flip to true once WhatsApp is live
// (verification approved + edge functions deployed + template secret set).
const PHONE_OTP_ENABLED = false;

// Single entry point (replaces the old welcome -> login -> signup split):
// one phone number can only ever be one account, so there's nothing to
// disambiguate up front -- Google is one tap, and the phone path below
// works the same whether the number is new or returning (the backend
// decides that, see verify-whatsapp-otp).
export default function AuthScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: 24,
          paddingTop: 80,
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
        googleButton: {
          marginTop: 28,
        },
        googleBadge: {
          width: 20,
          height: 20,
          borderRadius: 5,
          backgroundColor: "#4285F4",
          alignItems: "center",
          justifyContent: "center",
        },
        googleBadgeText: {
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: "800",
        },
        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginTop: 24,
        },
        dividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        },
        dividerText: {
          fontSize: 12.5,
          color: colors.muted,
        },
        form: {
          marginTop: 24,
          gap: 16,
        },
        error: {
          color: colors.error,
          fontSize: 12.5,
        },
        consentRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
        },
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
        checkboxChecked: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        consentLabel: {
          flex: 1,
          fontSize: 12.5,
          color: colors.muted,
          lineHeight: 17,
        },
        consentLink: {
          color: colors.primary,
          fontWeight: "700",
        },
      }),
    [colors],
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    if (!consentGiven) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setIsGoogleSubmitting(true);
    useSessionStore.getState().setAuthError(null);
    try {
      // Just opens the browser and waits for it to close. The actual
      // completion (code exchange, consent, phone check, routing) happens
      // in _layout.tsx's root Linking listener + auth-callback.tsx once the
      // redirect lands -- see signInWithGoogle's comment for why.
      await signInWithGoogle();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      useSessionStore.getState().setAuthError(message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handlePhoneContinue() {
    setError(null);
    if (!consentGiven) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setError("Enter your mobile number.");
      return;
    }
    setIsPhoneSubmitting(true);
    try {
      await sendPhoneOtp(phone);
      router.push({
        pathname: "/otp",
        params: {
          phone,
          name: name.trim(),
          referralCode: referralCode.trim() || undefined,
          consent: "1",
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPhoneSubmitting(false);
    }
  }

  // Interim email OTP -- works today while WhatsApp phone OTP waits on Meta
  // Business Verification. Same downstream flow; the code just arrives by email.
  async function handleEmailContinue() {
    setError(null);
    if (!consentGiven) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setIsEmailSubmitting(true);
    try {
      await sendEmailOtp(email, name);
      router.push({
        pathname: "/otp",
        params: {
          email: email.trim(),
          channel: "email",
          name: name.trim(),
          referralCode: referralCode.trim() || undefined,
          consent: "1",
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsEmailSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconChip}>
        <HeartPulse size={28} color="#FFFFFF" strokeWidth={2} />
      </View>
      <Text style={styles.title}>Welcome to CuraLink</Text>
      <Text style={styles.subtitle}>Book care for your family, right at home.</Text>

      <Button
        label={isGoogleSubmitting ? "Connecting..." : "Continue with Google"}
        variant="secondary"
        loading={isGoogleSubmitting}
        icon={
          <View style={styles.googleBadge}>
            <Text style={styles.googleBadgeText}>G</Text>
          </View>
        }
        style={styles.googleButton}
        onPress={() => void handleGoogle()}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{PHONE_OTP_ENABLED ? "or continue with phone" : "or continue with email"}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.form}>
        <TextField label="Full name" placeholder="Priya Nair" value={name} onChangeText={setName} />
        {PHONE_OTP_ENABLED ? (
          <TextField
            label="Mobile number"
            placeholder="98480 12345"
            phonePrefix="+91"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        ) : null}
        <TextField
          label="Referral code (optional)"
          placeholder="e.g. AB12CD"
          autoCapitalize="characters"
          value={referralCode}
          onChangeText={setReferralCode}
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
        {PHONE_OTP_ENABLED ? (
          <>
            <Button
              label={isPhoneSubmitting ? "Sending..." : "Send OTP"}
              disabled={isPhoneSubmitting}
              onPress={() => void handlePhoneContinue()}
            />
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or get the code by email</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        ) : null}
        <TextField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Button
          label={isEmailSubmitting ? "Sending..." : "Email me a code"}
          variant="secondary"
          disabled={isEmailSubmitting}
          onPress={() => void handleEmailContinue()}
        />
      </View>
    </View>
  );
}
