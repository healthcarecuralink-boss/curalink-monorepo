import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { HeartPulse } from "lucide-react-native";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSessionStore } from "@curalink/api-client";
import { curalinkFonts, useTheme } from "@curalink/ui";

const MIN_SPLASH_MS = 1400;

// Splash auto-advances (README onboarding order: Splash -> Welcome/Login ->
// ... ). Where it lands depends on session state: signed out -> Welcome;
// signed in but no family_members yet ("care setup" incomplete) -> Care
// setup; otherwise -> Home.
export default function SplashScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primaryStrong,
          gap: 14,
        },
        logoRing: {
          width: 92,
          height: 92,
          borderRadius: 28,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        },
        logo: {
          alignItems: "center",
          justifyContent: "center",
        },
        wordmark: {
          fontFamily: curalinkFonts.heading,
          fontSize: 34,
          color: "#FFFFFF",
          marginTop: 6,
        },
        tagline: {
          fontSize: 14.5,
          color: "rgba(255,255,255,0.85)",
        },
        footer: {
          position: "absolute",
          bottom: 56,
          fontSize: 11.5,
          letterSpacing: 1.4,
          color: "rgba(255,255,255,0.55)",
        },
      }),
    [colors],
  );
  const isLoading = useSessionStore((s) => s.isLoading);
  const session = useSessionStore((s) => s.session);
  const [pulse] = useState(() => new Animated.Value(0.9));
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.9, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (isLoading) return;

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const timer = setTimeout(() => {
      if (!session) {
        router.replace("/welcome");
        return;
      }
      // Home screen itself checks for a "self" family member and can send
      // the user to care-setup if it's missing -- keep splash's own
      // redirect logic to just "authenticated or not" so it doesn't need
      // an extra round trip before showing anything.
      router.replace("/(tabs)/home");
    }, remaining);
    return () => clearTimeout(timer);
  }, [isLoading, session, startedAt]);

  return (
    <Pressable style={styles.container} onPress={() => !isLoading && router.replace(session ? "/(tabs)/home" : "/welcome")}>
      <Animated.View style={[styles.logoRing, { transform: [{ scale: pulse }] }]}>
        <View style={styles.logo}>
          <HeartPulse size={46} color={colors.primary} strokeWidth={2} />
        </View>
      </Animated.View>
      <Text style={styles.wordmark}>CuraLink</Text>
      <Text style={styles.tagline}>Care, comfort, connected.</Text>
      <Text style={styles.footer}>MADE WITH CARE IN HYDERABAD</Text>
    </Pressable>
  );
}
