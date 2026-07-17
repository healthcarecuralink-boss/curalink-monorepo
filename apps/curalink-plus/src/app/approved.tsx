import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSessionStore, type ProfessionalRole } from "@curalink/api-client";
import { curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function ApprovedScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primaryPress, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
    iconRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 22,
    },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: "#FFFFFF", textAlign: "center" },
    body: { fontSize: 13.5, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 10, lineHeight: 20 },
    cta: {
      marginTop: 28,
      alignSelf: "stretch",
      height: 52,
      borderRadius: 11,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    ctaLabel: { fontSize: 14, fontWeight: "700", color: colors.primaryPress },
        }),
      [colors],
    );
  const { role } = useLocalSearchParams<{ role: ProfessionalRole }>();
  const profile = useSessionStore((s) => s.profile);
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <Check size={40} color="#FFFFFF" strokeWidth={2.4} />
      </View>
      <Text style={styles.title}>You&apos;re verified, {firstName}</Text>
      <Text style={styles.body}>
        You&apos;re now part of the CuraLink care network. Set your availability and you&apos;re ready for your first
        job.
      </Text>

      <Pressable
        style={styles.cta}
        onPress={() => router.replace({ pathname: "/availability-setup", params: { role } })}
      >
        <Text style={styles.ctaLabel}>Set my availability</Text>
      </Pressable>
    </View>
  );
}
