import { useEffect, useRef, useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Mail, Phone } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  CONSENT_VERSION,
  fetchProfessionalCredentials,
  getErrorMessage,
  recordConsent,
  redeemReferralCode,
  requestRole,
  resendEmailOtp,
  resendPhoneOtp,
  signInWithPhonePassword,
  supabase,
  verifyEmailOtp,
  verifyPhoneOtp,
  toE164IndianPhone,
  type ProfessionalRole,
} from "@curalink/api-client";
import { Button, curalinkPlusFonts, useTheme } from "@curalink/ui";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 100, alignItems: "center" },
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
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#E8F5F0",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 24, color: colors.ink },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 8, textAlign: "center" },
    subtitleAccent: { fontWeight: "700", color: colors.ink },
    changeLink: { fontWeight: "700", color: colors.primary },
    boxRow: { flexDirection: "row", gap: 8, marginTop: 28 },
    box: {
      width: 44,
      height: 54,
      borderRadius: 12,
      borderWidth: 2,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    boxText: { fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink },
    hiddenInput: { position: "absolute", opacity: 0, height: 1, width: 1 },
    error: { color: colors.error, fontSize: 12.5, marginTop: 14 },
    verifyButton: { marginTop: 26, alignSelf: "stretch" },
    resend: { marginTop: 18, fontSize: 12.5, color: colors.muted },
    resendAccent: { color: colors.primary, fontWeight: "700" },
        }),
      [colors],
    );
  const { phone, email, channel, name, role, consent, referralCode } = useLocalSearchParams<{
    phone?: string;
    email?: string;
    // "email" = interim Supabase email OTP; anything else = phone (WhatsApp) OTP.
    channel?: string;
    name?: string;
    role?: ProfessionalRole;
    consent?: string;
    referralCode?: string;
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
      const user = sessionData.session?.user;
      if (user && name) {
        await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
      }
      if (user && consent) {
        await recordConsent(user.id, CONSENT_VERSION);
      }
      if (user && referralCode) {
        // Best-effort: an invalid/already-used code shouldn't block signup.
        try {
          await redeemReferralCode(referralCode);
        } catch {
          // ignore
        }
      }

      if (!user) {
        router.replace("/welcome");
        return;
      }

      const { data: profileRow } = await supabase.from("profiles").select("roles").eq("id", user.id).single();
      if (role && profileRow?.roles?.includes(role)) {
        router.replace("/(tabs)/home");
        return;
      }

      const credentials = await fetchProfessionalCredentials(user.id);
      if (role && credentials?.pending_roles.includes(role)) {
        router.replace("/verification-pending");
        return;
      }

      // First-time applicant: record interest now so professional_credentials
      // exists for the rest of onboarding to progressively save into (the
      // role itself isn't granted until an admin calls approve_role).
      if (role) {
        await requestRole(role);
      }
      router.replace({ pathname: "/professional-details-1", params: { role } });
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
        await resendEmailOtp(email ?? "");
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
          <Mail size={24} color={colors.primary} strokeWidth={1.8} />
        ) : (
          <Phone size={24} color={colors.primary} strokeWidth={1.8} />
        )}
      </View>
      <Text style={styles.title}>{isEmail ? "Verify your email" : "Verify your number"}</Text>
      <Text style={styles.subtitle}>
        Enter the {CODE_LENGTH}-digit code sent to{" "}
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
            <View key={i} style={[styles.box, { borderColor: filled || isActive ? colors.primary : colors.border }]}>
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
          `Resend code in 00:${String(secondsLeft).padStart(2, "0")}`
        ) : (
          <Text style={styles.resendAccent} onPress={() => void handleResend()}>
            Resend code
          </Text>
        )}
      </Text>
    </View>
  );
}
