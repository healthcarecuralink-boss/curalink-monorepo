import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  CONSENT_VERSION,
  fetchFamilyMembers,
  getErrorMessage,
  hasRecordedConsent,
  recordConsent,
  supabase,
  useSessionStore,
} from "@curalink/api-client";
import { Button, curalinkFonts, useTheme } from "@curalink/ui";

const WAIT_TIMEOUT_MS = 10000;

// Landing spot for the curalink://auth-callback deep link that Supabase
// redirects to after Google sign-in. Expo Router treats any URL matching
// the app's registered `scheme` as a real route -- without a screen here,
// it renders its own "Unmatched Route" 404. The actual sign-in completion
// (exchanging the code) happens in a root-level Linking listener in
// _layout.tsx, not here -- this screen just waits for the session that
// produces to show up in the shared store, then does the one-time
// post-signup bookkeeping (consent, phone check) and routes onward.
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
        const { data: profile } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
        if (!profile?.phone) {
          router.replace("/add-phone");
          return;
        }
        const familyMembers = await fetchFamilyMembers(userId);
        router.replace(familyMembers.length > 0 ? "/(tabs)/home" : "/care-setup");
      } catch (err) {
        useSessionStore.getState().setAuthError(getErrorMessage(err));
      }
    })();
  }, [session?.user.id]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), WAIT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  function backToSignIn() {
    useSessionStore.getState().setAuthError(null);
    router.replace("/auth");
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
    text: { fontFamily: curalinkFonts.heading, fontSize: 16, color: colors.ink, textAlign: "center" },
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
