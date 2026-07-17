import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchWalletBalance, fetchWalletTransactions, useSessionStore } from "@curalink/api-client";
import { Card, EmptyState, ErrorState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";

export default function WalletScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 66, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
        title: { fontFamily: curalinkFonts.heading, fontSize: 25, color: colors.ink },
        balanceCard: { flexDirection: "row", alignItems: "center", gap: 14 },
        balanceIcon: {
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: "#E9FBF3",
          alignItems: "center",
          justifyContent: "center",
        },
        balanceLabel: { fontSize: 12, color: colors.muted },
        balanceValue: { fontFamily: curalinkFonts.heading, fontSize: 26, color: colors.ink, marginTop: 2 },
        note: { fontSize: 12.5, color: colors.muted2, textAlign: "center" },
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: colors.ink },
        txnRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        txnIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.divider, alignItems: "center", justifyContent: "center" },
        txnDescription: { fontSize: 13, fontWeight: "600", color: colors.ink },
        txnMeta: { fontSize: 11, color: colors.muted2, marginTop: 2 },
        txnAmountCredit: { fontSize: 13.5, fontWeight: "700", color: colors.primary },
        txnAmountDebit: { fontSize: 13.5, fontWeight: "700", color: colors.error },
      }),
    [colors],
  );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const {
    data: balance,
    isError: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["walletBalance", userId],
    queryFn: () => fetchWalletBalance(userId as string),
    enabled: Boolean(userId),
  });
  const {
    data: transactions,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["walletTransactions", userId],
    queryFn: () => fetchWalletTransactions(userId as string),
    enabled: Boolean(userId),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Wallet</Text>
      <Card style={styles.balanceCard}>
        <View style={styles.balanceIcon}>
          <WalletIcon size={22} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View>
          <Text style={styles.balanceLabel}>Available balance</Text>
          {balanceError ? (
            <Text style={styles.txnMeta}>Couldn&apos;t load</Text>
          ) : balance === undefined ? (
            <Skeleton width={120} height={28} borderRadius={6} />
          ) : (
            <Text style={styles.balanceValue}>₹{balance.toLocaleString("en-IN")}</Text>
          )}
        </View>
      </Card>
      <Text style={styles.note}>Adding money needs Razorpay — lands with that integration.</Text>

      <Text style={styles.sectionTitle}>Transaction history</Text>
      {transactionsError ? (
        <ErrorState onRetry={() => void refetchTransactions()} />
      ) : transactions === undefined ? (
        <Skeleton height={70} borderRadius={16} />
      ) : transactions.length === 0 ? (
        <EmptyState icon={<WalletIcon size={26} color={colors.primary} strokeWidth={1.6} />} title="No transactions yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {transactions.map((txn) => (
            <Pressable key={txn.id} onPress={() => router.push(`/transaction/${txn.id}`)}>
              <Card style={styles.txnRow}>
                <View style={styles.txnIcon}>
                  {txn.type === "credit" ? (
                    <ArrowDownLeft size={16} color={colors.primary} strokeWidth={1.8} />
                  ) : (
                    <ArrowUpRight size={16} color={colors.error} strokeWidth={1.8} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnDescription}>{txn.description ?? (txn.type === "credit" ? "Credit" : "Debit")}</Text>
                  <Text style={styles.txnMeta}>{new Date(txn.created_at).toLocaleDateString("en-IN")}</Text>
                </View>
                <Text style={txn.type === "credit" ? styles.txnAmountCredit : styles.txnAmountDebit}>
                  {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
      {balanceError ? <ErrorState onRetry={() => void refetchBalance()} /> : null}
    </ScrollView>
  );
}
