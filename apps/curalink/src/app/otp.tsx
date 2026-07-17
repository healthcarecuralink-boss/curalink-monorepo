import { useEffect, useRef, useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Phone } from "lucide-react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  CONSENT_VERSION,
  fetchFamilyMembers,
  getErrorMessage,
  recordConsent,
  redeemReferralCode,
  signInWithPhonePassword,
  supabase,
  verifyMsg91AccessToken,
  toE164IndianPhone,
} from "@curalink/api-client";
import { Button, curalinkFonts, useTheme } from "@curalink/ui";
import { retryMsg91Otp, verifyMsg91Otp } from "../utils/msg91Widget";

const CODE_LENGTH = 4;
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
  const { phone, name, referralCode, consent, reqId } = useLocalSearchParams<{
    phone: string;
    name?: string;
    referralCode?: string;
    consent?: string;
    reqId: string;
  }>();
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
      const accessToken = await verifyMsg91Otp(reqId, fullCode);
      const { password } = await verifyMsg91AccessToken(phone, accessToken);
      await signInWithPhonePassword(phone, password);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (userId && name) {
        await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
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
        const familyMembers = await fetchFamilyMembers(userId);
        router.replace(familyMembers.length > 0 ? "/(tabs)/home" : "/care-setup");
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
      await retryMsg91Otp(reqId);
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
      <View style={styles.iconChip}>
        <Phone size={26} color={colors.navy} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>
        We sent a {CODE_LENGTH}-digit code to <Text style={styles.subtitleAccent}>{toE164IndianPhone(phone ?? "")}</Text>
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
