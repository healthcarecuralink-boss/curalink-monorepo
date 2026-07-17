import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { fetchJobDetail } from "@curalink/api-client";
import { Button, Card, curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function VisitCompletedScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primaryPress, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    iconRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: "#FFFFFF" },
    body: { fontSize: 13.5, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 10, lineHeight: 20 },
    summaryCard: { marginTop: 20, alignItems: "center", backgroundColor: "#FFFFFF" },
    summaryLabel: { fontSize: 11.5, color: colors.muted },
    summaryValue: { fontFamily: curalinkPlusFonts.heading, fontSize: 24, color: colors.ink, marginTop: 4 },
    cta: { marginTop: 28, alignSelf: "stretch", backgroundColor: "#FFFFFF" },
        }),
      [colors],
    );
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: detail } = useQuery({
    queryKey: ["jobDetail", id],
    queryFn: () => fetchJobDetail(id),
    enabled: Boolean(id),
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <CheckCircle2 size={44} color="#FFFFFF" strokeWidth={2} />
      </View>
      <Text style={styles.title}>Visit completed</Text>
      <Text style={styles.body}>Nice work{detail?.patientName ? ` with ${detail.patientName}` : ""}. Earnings for this visit are on their way.</Text>

      {detail ? (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Earned</Text>
          <Text style={styles.summaryValue}>₹{detail.booking.price}</Text>
        </Card>
      ) : null}

      <Button label="Back to jobs" variant="secondary" onPress={() => router.replace("/(tabs)/jobs")} style={styles.cta} />
    </View>
  );
}
