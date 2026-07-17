import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Button, curalinkFonts, useTheme } from "@curalink/ui";

export default function BookingSuccessScreen() {
  const { colors } = useTheme();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
        title: { fontFamily: curalinkFonts.heading, fontSize: 22, color: colors.ink, textAlign: "center" },
        body: { fontSize: 13.5, color: colors.muted2, textAlign: "center", lineHeight: 20, maxWidth: 300 },
        buttonRow: { gap: 10, width: "100%", marginTop: 12 },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <CheckCircle2 size={56} color={colors.primary} strokeWidth={1.5} />
      <Text style={styles.title}>Request sent!</Text>
      <Text style={styles.body}>
        We&apos;re finding a nearby professional for you now. You&apos;ll get a notification the moment someone accepts.
      </Text>
      <View style={styles.buttonRow}>
        <Button label="View booking" onPress={() => router.replace(`/bookings/${bookingId}`)} />
        <Button label="Back to home" variant="secondary" onPress={() => router.replace("/(tabs)/home")} />
      </View>
    </View>
  );
}
