import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  CONSENT_VERSION,
  fetchProfessionalCredentials,
  hasRecordedConsent,
  recordConsent,
  requestRole,
  supabase,
  useSessionStore,
} from "@curalink/api-client";
import { Button, curalinkPlusFonts, useTheme } from "@curalink/ui";

const WAIT_TIMEOUT_MS = 10000;

// Landing spot for the curalinkplus://auth-callback deep link Supabase
// redirects to after Google sign-in (see signInWithGoogle's comment for why
// the actual session exchange happens in a root-level Linking listener in
// _layout.tsx, not here). Unlike the phone/email OTP path, Google's redirect
// doesn't carry a `role` param through the browser round-trip -- login.tsx
// stashes the applicant's chosen role in pendingApplyRole right before
// kicking off signInWithGoogle so it survives the trip, and this screen
// consumes it: existing-role holders go home, an in-flight application goes
// to verification-pending, and a fresh applicant's pending role (if any)
// gets requested here directly and sent to professional-details-1 --
// otherwise (plain Google sign-in, no role chosen) they land on /signup.
export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const session = useSessionStore((s) => s.session);
  const authError = useSessionStore((s) => s.authError);
  const [timedOut, setTimedOut] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        if (!(await hasRecordedConsent(userId))) {
          await recordConsent(userId, CONSENT_VERSION);
        }
        const { data: profile } = await supabase.from("profiles").select("roles").eq("id", userId).maybeSingle();
        if (profile?.roles && profile.roles.length > 0) {
          useSessionStore.getState().setPendingApplyRole(null);
          router.replace("/(tabs)/home");
          return;
        }
        const credentials = await fetchProfessionalCredentials(userId);
        const pendingRole = credentials?.pending_roles?.[0];
        if (pendingRole) {
          useSessionStore.getState().setPendingApplyRole(null);
          router.replace({ pathname: "/verification-pending", params: { role: pendingRole } });
          return;
        }
        const applyRole = useSessionStore.getState().pendingApplyRole;
        useSessionStore.getState().setPendingApplyRole(null);
        if (applyRole) {
          await requestRole(applyRole);
          router.replace({ pathname: "/professional-details-1", params: { role: applyRole } });
          return;
        }
        router.replace("/signup");
      } catch (err) {
        useSessionStore.getState().setAuthError(err instanceof Error ? err.message : "Something went wrong.");
      }
    })();
  }, [session?.user.id]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), WAIT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  function backToSignIn() {
    useSessionStore.getState().setAuthError(null);
    router.replace("/login");
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
    text: { fontFamily: curalinkPlusFonts.heading, fontSize: 16, color: colors.ink, textAlign: "center" },
    subtext: { fontSize: 13.5, color: colors.muted, textAlign: "center" },
  });

  if (authError) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Sign-in failed</Text>
        <Text style={styles.subtext}>{authError}</Text>
        <Button label="Back to sign in" onPress={backToSignIn} />
      </View>
    );
  }

  if (timedOut && !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Sign-in is taking longer than expected</Text>
        <Text style={styles.subtext}>Head back and try again.</Text>
        <Button label="Back to sign in" onPress={backToSignIn} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Finishing sign-in...</Text>
    </View>
  );
}
