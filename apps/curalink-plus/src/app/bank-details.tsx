import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { updateProfessionalCredentials, useSessionStore, type ProfessionalRole } from "@curalink/api-client";
import { Button, Card, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function BankDetailsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 90 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 24, color: colors.ink },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 4 },
    form: { marginTop: 24, gap: 16 },
    noteCard: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#EAF1FE",
      borderColor: "#CFE0FB",
    },
    noteText: { flex: 1, fontSize: 12, color: colors.ink2 },
    cta: { marginTop: 28 },
        }),
      [colors],
    );
  const { role } = useLocalSearchParams<{ role: ProfessionalRole }>();
  const session = useSessionStore((s) => s.session);
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const userId = session?.user.id;
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await updateProfessionalCredentials(userId, {
        bank_details: { account_holder: accountHolder, account_number: accountNumber, ifsc },
      });
      router.replace({ pathname: "/verification-pending", params: { role } });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payout details</Text>
      <Text style={styles.subtitle}>Where should we send your earnings?</Text>

      <View style={styles.form}>
        <TextField label="Account holder name" placeholder="Priya Sharma" value={accountHolder} onChangeText={setAccountHolder} />
        <TextField
          label="Account number"
          placeholder="50100223344556"
          keyboardType="number-pad"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />
        <TextField label="IFSC code" placeholder="HDFC0001234" autoCapitalize="characters" value={ifsc} onChangeText={setIfsc} />
      </View>

      <Card style={styles.noteCard}>
        <ShieldCheck size={18} color={colors.primary} strokeWidth={1.8} />
        <Text style={styles.noteText}>Encrypted end-to-end. Only used for weekly payouts.</Text>
      </Card>

      <Button
        label={isSubmitting ? "Submitting..." : "Submit application"}
        disabled={isSubmitting}
        onPress={() => void handleSubmit()}
        style={styles.cta}
      />
    </View>
  );
}
