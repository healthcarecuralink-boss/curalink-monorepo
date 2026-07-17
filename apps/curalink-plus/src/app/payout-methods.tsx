import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Plus, Smartphone } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createPayoutMethod, fetchPayoutMethods, useSessionStore } from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function PayoutMethodsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink },
    methodRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    methodLabel: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 13.5, color: colors.ink },
    methodDetail: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
    defaultBadge: { fontSize: 10.5, fontWeight: "700", color: colors.primary },
    addRow: { gap: 10 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const { data: methods } = useQuery({
    queryKey: ["payoutMethods", userId],
    queryFn: () => fetchPayoutMethods(userId as string),
    enabled: Boolean(userId),
  });

  const [showForm, setShowForm] = useState<"bank" | "upi" | null>(null);
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd() {
    if (!userId || !showForm) return;
    setIsSaving(true);
    try {
      await createPayoutMethod({
        professional_id: userId,
        method: showForm,
        details:
          showForm === "bank"
            ? { account_holder: accountHolder, account_number: accountNumber, ifsc }
            : { upi_id: upiId },
        is_default: (methods?.length ?? 0) === 0,
      });
      void queryClient.invalidateQueries({ queryKey: ["payoutMethods", userId] });
      setShowForm(null);
      setAccountHolder("");
      setAccountNumber("");
      setIfsc("");
      setUpiId("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Payout methods</Text>
      </View>

      {methods === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : methods.length === 0 ? (
        <EmptyState icon={<Building2 size={26} color={colors.primary} strokeWidth={1.6} />} title="No payout method yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {methods.map((method) => (
            <Card key={method.id} style={styles.methodRow}>
              {method.method === "bank" ? (
                <Building2 size={18} color={colors.primary} strokeWidth={1.8} />
              ) : (
                <Smartphone size={18} color={colors.primary} strokeWidth={1.8} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{method.method === "bank" ? "Bank account" : "UPI"}</Text>
                <Text style={styles.methodDetail}>
                  {method.method === "bank"
                    ? `••••${String((method.details as { account_number?: string }).account_number ?? "").slice(-4)}`
                    : (method.details as { upi_id?: string }).upi_id}
                </Text>
              </View>
              {method.is_default ? <Text style={styles.defaultBadge}>Default</Text> : null}
            </Card>
          ))}
        </View>
      )}

      {!showForm ? (
        <View style={styles.addRow}>
          <Button label="Add bank account" variant="secondary" icon={<Plus size={16} color={colors.ink} />} onPress={() => setShowForm("bank")} />
          <Button label="Add UPI" variant="secondary" icon={<Plus size={16} color={colors.ink} />} onPress={() => setShowForm("upi")} />
        </View>
      ) : (
        <Card style={{ gap: 12 }}>
          {showForm === "bank" ? (
            <>
              <TextField label="Account holder name" value={accountHolder} onChangeText={setAccountHolder} />
              <TextField label="Account number" keyboardType="number-pad" value={accountNumber} onChangeText={setAccountNumber} />
              <TextField label="IFSC code" autoCapitalize="characters" value={ifsc} onChangeText={setIfsc} />
            </>
          ) : (
            <TextField label="UPI ID" placeholder="name@bank" value={upiId} onChangeText={setUpiId} />
          )}
          <Button label={isSaving ? "Saving..." : "Save"} disabled={isSaving} onPress={() => void handleAdd()} />
        </Card>
      )}
    </ScrollView>
  );
}
