import { useEffect, useRef, useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Mail, Phone } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  CONSENT_VERSION,
  fetchAddresses,
  fetchFamilyMembers,
  getErrorMessage,
  recordConsent,
  redeemReferralCode,
  resendEmailOtp,
  resendPhoneOtp,
  signInWithPhonePassword,
  supabase,
  useSessionStore,
  verifyEmailOtp,
  verifyPhoneOtp,
  toE164IndianPhone,
} from "@curalink/api-client";
import { Button, curalinkFonts, useTheme } from "@curalink/ui";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 24,
      paddingTop: 100,
      alignItems: "center",
    },
    backButton: {
      position: "absolute",
      top: 56,
      left: 24,
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    iconChip: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor: "#E9FBF3",
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
      marginTop: 8,
      textAlign: "center",
    },
    subtitleAccent: {
      fontWeight: "700",
      color: colors.ink,
    },
    changeLink: {
      fontWeight: "700",
      color: colors.primary,
    },
    boxRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 32,
    },
    box: {
      width: 46,
      height: 56,
      borderRadius: 14,
      borderWidth: 2,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    boxText: {
      fontFamily: curalinkFonts.heading,
      fontSize: 22,
      color: colors.ink,
    },
    hiddenInput: {
      position: "absolute",
      opacity: 0,
      height: 1,
      width: 1,
    },
    error: {
      color: colors.error,
      fontSize: 12.5,
      marginTop: 16,
    },
    verifyButton: {
      marginTop: 28,
      alignSelf: "stretch",
    },
    resend: {
      marginTop: 20,
      fontSize: 13,
      color: colors.muted,
    },
    resendAccent: {
      color: colors.primary,
      fontWeight: "700",
    },
        }),
      [colors],
    );
  const { phone, email, channel, name, referralCode, consent } = useLocalSearchParams<{
    phone?: string;
    email?: string;
    // "email" = interim Supabase email OTP; anything else = phone (WhatsApp) OTP.
    channel?: string;
    name?: string;
    referralCode?: string;
    consent?: string;
  }>();
  const isEmail = channel === "email";
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  async function handleVerify(fullCode: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEmail) {
        // verifyOtp establishes the session itself -- no password bridge.
        await verifyEmailOtp(email ?? "", fullCode);
      } else {
        const { password } = await verifyPhoneOtp(phone ?? "", fullCode);
        await signInWithPhonePassword(phone ?? "", password);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (userId && name) {
        await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
        // The SIGNED_IN event from verifyEmailOtp/signInWithPhonePassword already
        // triggered a profile fetch (see sessionStore's onAuthStateChange listener),
        // which can race this update and cache the trigger's placeholder name.
        // Refresh once more now that the real name is written.
        await useSessionStore.getState().refreshProfile();
      }
      if (userId && consent) {
        await recordConsent(userId, CONSENT_VERSION);
      }
      if (userId && referralCode) {
        // Best-effort: an invalid/already-used code shouldn't block signup.
        try {
          await redeemReferralCode(referralCode);
        } catch {
          // ignore
        }
      }

      if (userId) {
        const addresses = await fetchAddresses(userId);
        if (addresses.length === 0) {
          // First-time signup: ask for a tentative area before the rest of
          // onboarding -- location-setup.tsx handles the care-setup/home
          // routing itself once it's done (or skipped).
          router.replace("/location-setup");
        } else {
          const familyMembers = await fetchFamilyMembers(userId);
          router.replace(familyMembers.length > 0 ? "/(tabs)/home" : "/care-setup");
        }
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setCode("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      if (isEmail) {
        await resendEmailOtp(email ?? "", name);
      } else {
        await resendPhoneOtp(phone ?? "");
      }
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function onChangeCode(value: string) {
    const digits = value.replace(/[^\d]/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) {
      void handleVerify(digits);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backButton}
        hitSlop={8}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
      </Pressable>

      <View style={styles.iconChip}>
        {isEmail ? (
          <Mail size={26} color={colors.navy} strokeWidth={1.8} />
        ) : (
          <Phone size={26} color={colors.navy} strokeWidth={1.8} />
        )}
      </View>
      <Text style={styles.title}>{isEmail ? "Verify your email" : "Verify your number"}</Text>
      <Text style={styles.subtitle}>
        We sent a {CODE_LENGTH}-digit code to{" "}
        <Text style={styles.subtitleAccent}>{isEmail ? email : toE164IndianPhone(phone ?? "")}</Text>
        {"  "}
        <Text style={styles.changeLink} onPress={() => router.back()}>
          Change
        </Text>
      </Text>

      <View style={styles.boxRow} onTouchEnd={() => inputRef.current?.focus()}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => {
          const filled = i < code.length;
          const isActive = i === code.length;
          return (
            <View
              key={i}
              style={[
                styles.box,
                { borderColor: filled ? colors.navy2 : isActive ? colors.primary : colors.border },
              ]}
            >
              <Text style={styles.boxText}>{code[i] ?? ""}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChangeCode}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        autoFocus
        style={styles.hiddenInput}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={isSubmitting ? "Verifying..." : "Verify & continue"}
        disabled={code.length < CODE_LENGTH || isSubmitting}
        onPress={() => void handleVerify(code)}
        style={styles.verifyButton}
      />

      <Text style={styles.resend}>
        {secondsLeft > 0 ? (
          `Didn't get it? Resend in ${secondsLeft}s`
        ) : (
          <Text style={styles.resendAccent} onPress={() => void handleResend()}>
            Resend code
          </Text>
        )}
      </Text>
    </View>
  );
}
