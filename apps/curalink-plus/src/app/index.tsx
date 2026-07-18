import { useEffect, useState, useMemo } from "react";
import { router } from "expo-router";
import { Stethoscope } from "lucide-react-native";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSessionStore } from "@curalink/api-client";
import { curalinkPlusFonts, useTheme } from "@curalink/ui";

const MIN_SPLASH_MS = 1300;

export default function SplashScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryPress,
      gap: 14,
    },
    logoBox: {
      width: 88,
      height: 88,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    wordmark: {
      fontFamily: curalinkPlusFonts.heading,
      fontSize: 28,
      color: "#FFFFFF",
      marginTop: 6,
    },
    wordmarkLight: {
      fontFamily: curalinkPlusFonts.body,
      fontWeight: "600",
    },
    tagline: {
      fontSize: 14,
      color: "rgba(255,255,255,0.85)",
    },
    footer: {
      position: "absolute",
      bottom: 56,
      fontSize: 11,
      letterSpacing: 1.2,
      color: "rgba(255,255,255,0.55)",
    },
        }),
      [colors],
    );
  const isLoading = useSessionStore((s) => s.isLoading);
  const session = useSessionStore((s) => s.session);
  const [pulse] = useState(() => new Animated.Value(0.92));
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.92, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (isLoading) return;
    const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt));
    const timer = setTimeout(() => {
      // No login/OTP flow anymore -- initSessionListener always establishes
      // a (dev-mode anonymous) session before this fires.
      router.replace("/(tabs)/home");
    }, remaining);
    return () => clearTimeout(timer);
  }, [isLoading, session, startedAt]);

  return (
    <Pressable
      style={styles.container}
      onPress={() => !isLoading && router.replace("/(tabs)/home")}
    >
      <Animated.View style={[styles.logoBox, { transform: [{ scale: pulse }] }]}>
        <Stethoscope size={40} color={colors.primary} strokeWidth={1.8} />
      </Animated.View>
      <Text style={styles.wordmark}>
        CuraLink <Text style={styles.wordmarkLight}>Plus</Text>
      </Text>
      <Text style={styles.tagline}>Care, delivered.</Text>
      <Text style={styles.footer}>FOR CURALINK PROFESSIONALS</Text>
    </Pressable>
  );
}
