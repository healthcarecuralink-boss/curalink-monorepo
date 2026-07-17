import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchWalletTransactionById } from "@curalink/api-client";
import { Card, Skeleton, StatusPill, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";

function statusPillFor(status: string) {
  switch (status) {
    case "completed":
      return curalinkStatusPillColors.completed;
    case "failed":
      return curalinkStatusPillColors.cancelled;
    default:
      return curalinkStatusPillColors.pending;
  }
}

export default function TransactionDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
        header: { flexDirection: "row", alignItems: "center", gap: 12 },
        backButton: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { fontFamily: curalinkFonts.heading, fontSize: 19, color: colors.ink },
        amountCard: { alignItems: "center", gap: 10, paddingVertical: 24 },
        amountIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
        amountValue: { fontFamily: curalinkFonts.heading, fontSize: 28 },
        description: { fontSize: 13.5, color: colors.ink2 },
        row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
        rowLabel: { fontSize: 12.5, color: colors.muted },
        rowValue: { fontSize: 12.5, fontWeight: "700", color: colors.ink, flexShrink: 1, textAlign: "right", marginLeft: 12 },
      }),
    [colors],
  );

  const { data: txn } = useQuery({
    queryKey: ["walletTransaction", id],
    queryFn: () => fetchWalletTransactionById(id),
    enabled: Boolean(id),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Transaction</Text>
      </View>

      {txn === undefined ? (
        <Skeleton height={200} borderRadius={18} />
      ) : txn === null ? (
        <Text style={{ fontSize: 13, color: colors.muted2 }}>Transaction not found.</Text>
      ) : (
        <>
          <Card style={styles.amountCard}>
            <View style={[styles.amountIcon, { backgroundColor: txn.type === "credit" ? "#E9FBF3" : "#FCECEC" }]}>
              {txn.type === "credit" ? (
                <ArrowDownLeft size={24} color={colors.primary} strokeWidth={1.8} />
              ) : (
                <ArrowUpRight size={24} color={colors.error} strokeWidth={1.8} />
              )}
            </View>
            <Text style={[styles.amountValue, { color: txn.type === "credit" ? colors.primary : colors.error }]}>
              {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
            </Text>
            <Text style={styles.description}>{txn.description ?? (txn.type === "credit" ? "Credit" : "Debit")}</Text>
            <StatusPill label={txn.status} {...statusPillFor(txn.status)} />
          </Card>

          <Card>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date</Text>
              <Text style={styles.rowValue}>{new Date(txn.created_at).toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Method</Text>
              <Text style={styles.rowValue}>{txn.method ?? "Wallet"}</Text>
            </View>
            {txn.reference ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Reference</Text>
                <Text style={styles.rowValue}>{txn.reference}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Transaction ID</Text>
              <Text style={styles.rowValue}>{txn.id.slice(0, 8)}</Text>
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
