import { useState, useMemo } from "react";
import { router } from "expo-router";
import { ChevronDown, LifeBuoy, ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, curalinkPlusFonts, useTheme } from "@curalink/ui";


const faqs = [
  {
    q: "How do I add another role to my account?",
    a: "Go to Profile → Add another role. You'll reuse your existing documents and bank details — an admin just needs to approve the new role.",
  },
  {
    q: "When do I get paid?",
    a: "Completed jobs are aggregated into payout records by CuraLink ops. Withdraw-on-demand is coming with the Razorpay integration; for now, check Earnings → Payout history for status.",
  },
  {
    q: "What happens if I can't complete a job?",
    a: "Message your care team or ops support immediately from the job detail screen so a reassignment can happen quickly.",
  },
  {
    q: "How is my rating calculated?",
    a: "Your rating is the average across all rated jobs — visits, pharmacy orders, or ambulance trips, depending on your role.",
  },
];

export default function HelpCenterScreen() {
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
    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    contactIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#E8F5F0", alignItems: "center", justifyContent: "center" },
    contactTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    contactSubtitle: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    faqQuestion: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.ink, marginRight: 10 },
    faqAnswer: { fontSize: 12.5, color: colors.ink, marginTop: 10, lineHeight: 18 },
        }),
      [colors],
    );
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
        <Text style={styles.title}>Help center</Text>
      </View>

      <Pressable style={styles.contactCard} onPress={() => router.push("/team-chat")}>
        <View style={styles.contactIcon}>
          <LifeBuoy size={18} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactTitle}>Contact ops support</Text>
          <Text style={styles.contactSubtitle}>Opens Team chat → Ops support chat</Text>
        </View>
      </Pressable>

      <Text style={styles.sectionTitle}>Frequently asked</Text>
      <View style={{ gap: 8 }}>
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <Card key={faq.q}>
              <Pressable style={styles.faqHeader} onPress={() => setOpenIndex(isOpen ? null : i)}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <ChevronDown size={16} color={colors.muted} style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }} />
              </Pressable>
              {isOpen ? <Text style={styles.faqAnswer}>{faq.a}</Text> : null}
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
