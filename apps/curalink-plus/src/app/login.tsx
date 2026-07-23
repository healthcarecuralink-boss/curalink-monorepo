import { useState, useMemo } from "react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, Stethoscope } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  getErrorMessage,
  sendEmailOtp,
  sendPhoneOtp,
  signInWithGoogle,
  signInWithPhonePassword,
  useSessionStore,
  type ProfessionalRole,
} from "@curalink/api-client";
import { Button, TextField, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";

// Phone (WhatsApp) OTP is temporarily hidden while Meta Business Verification is
// pending -- email OTP is the interim login. Flip to true once WhatsApp is live.
const PHONE_OTP_ENABLED = false;

// Dev-only bypass: one seeded account per role (see supabase/seed.sql) so QA
// can get past OTP delivery without a real phone. __DEV__-gated so it's
// stripped from release builds -- never a valid path in production.
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
//
// Two modes off the one `role` param: plain sign-in (no role -- Google +
// dev panel + email, for a returning professional who already has an
// account) and "apply" (role set, arrived via /signup -- mirrors CuraLink
// app's single joiner screen: Google, full name, optional referral code,
// terms/privacy consent, then email code).
export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 64 },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    iconChip: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 18 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 24, color: colors.ink },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 4 },
    googleButton: { marginTop: 24 },
    googleBadge: { width: 20, height: 20, borderRadius: 5, backgroundColor: "#4285F4", alignItems: "center", justifyContent: "center" },
    googleBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
    dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 12.5, color: colors.muted },
    form: { marginTop: 28, gap: 16 },
    error: { color: colors.error, fontSize: 12.5 },
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
    consentLabel: { flex: 1, fontSize: 12.5, color: colors.muted, lineHeight: 17 },
    consentLink: { color: colors.primary, fontWeight: "700" },
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
  const isApplying = Boolean(role);
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roleLabel = role ? roleLabels[role] : undefined;
  const accent = role ? roleAccents[role] : colors.primary;

  function requireConsent(): boolean {
    if (!isApplying || consentGiven) return true;
    setError("Please accept the Terms of Service and Privacy Policy to continue.");
    return false;
  }

  async function handleContinue() {
    setError(null);
    if (!requireConsent()) return;
    setIsSubmitting(true);
    try {
      await sendPhoneOtp(phone);
      router.push({
        pathname: "/otp",
        params: { phone, role, name: name.trim() || undefined, referralCode: referralCode.trim() || undefined, consent: isApplying ? "1" : undefined },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Interim email OTP -- works today while WhatsApp phone OTP waits on Meta
  // Business Verification.
  async function handleEmailContinue() {
    setError(null);
    if (!requireConsent()) return;
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendEmailOtp(email, name.trim() || undefined);
      router.push({
        pathname: "/otp",
        params: {
          email: email.trim(),
          channel: "email",
          role,
          name: name.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
          consent: isApplying ? "1" : undefined,
        },
      });
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

  // Google's redirect can't carry route params through the browser round
  // trip, so a chosen role would otherwise vanish -- stash it in the shared
  // session store first and auth-callback.tsx picks it back up once the
  // session lands (see pendingApplyRole's own comment for the full story).
  async function handleGoogle() {
    setError(null);
    if (!requireConsent()) return;
    setIsGoogleSubmitting(true);
    useSessionStore.getState().setAuthError(null);
    useSessionStore.getState().setPendingApplyRole(role ?? null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      useSessionStore.getState().setAuthError(message);
      useSessionStore.getState().setPendingApplyRole(null);
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {router.canGoBack() ? (
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
      ) : null}
      <View style={[styles.iconChip, { backgroundColor: accent }]}>
        <Stethoscope size={24} color="#FFFFFF" strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{isApplying ? `Apply as ${roleLabel}` : "Sign in"}</Text>
      <Text style={styles.subtitle}>
        {isApplying ? "Join the CuraLink partner network." : "CuraLink partner network"}
      </Text>

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
        <Text style={styles.dividerText}>or continue with email</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.form}>
        {isApplying ? <TextField label="Full name" placeholder="Priya Nair" value={name} onChangeText={setName} /> : null}
        {PHONE_OTP_ENABLED ? (
          <TextField
            label="Mobile number"
            placeholder="98481 22334"
            phonePrefix="+91"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        ) : null}
        {isApplying ? (
          <TextField
            label="Referral code (optional)"
            placeholder="e.g. AB12CD"
            autoCapitalize="characters"
            value={referralCode}
            onChangeText={setReferralCode}
          />
        ) : null}
        {isApplying ? (
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
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {PHONE_OTP_ENABLED ? (
          <Button label={isSubmitting ? "Sending..." : "Send OTP"} disabled={isSubmitting} onPress={() => void handleContinue()} />
        ) : null}

        <TextField
          label={PHONE_OTP_ENABLED ? "Or sign in with email" : "Email"}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Button
          label={isSubmitting ? "Sending..." : "Email me a code"}
          variant="secondary"
          disabled={isSubmitting}
          onPress={() => void handleEmailContinue()}
        />
      </View>

      {__DEV__ && !isApplying ? (
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

      {isApplying ? (
        <Link href="/login" style={styles.footerLink}>
          Already have an account? <Text style={styles.footerLinkAccent}>Sign in</Text>
        </Link>
      ) : (
        <Link href="/signup" style={styles.footerLink}>
          New professional? <Text style={styles.footerLinkAccent}>Apply to join</Text>
        </Link>
      )}
    </View>
  );
}
