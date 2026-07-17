import { useState, useMemo } from "react";
import { router } from "expo-router";
import { ArrowLeft, ChevronDown, LifeBuoy } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchOrCreateOpsChannel, useSessionStore } from "@curalink/api-client";
import { Card, curalinkFonts, useTheme } from "@curalink/ui";


const faqs = [
  {
    q: "How fast can a nurse or doctor reach me?",
    a: "Most home visits arrive within 55–90 minutes of booking, depending on your area and provider availability. Express bookings are prioritized.",
  },
  {
    q: "How do I know my provider has arrived?",
    a: "You'll get a live tracking screen once the visit is confirmed, plus an arrival OTP the provider will confirm with you at your door.",
  },
  {
    q: "Can I get medicines delivered after a visit?",
    a: "Yes — if your visit results in a prescription, you can order the medicines directly from the prescription detail screen and track fulfillment in Pharmacy orders.",
  },
  {
    q: "What if I need an ambulance instead of a home visit?",
    a: "Use the SOS button on Home for true emergencies, or the Ambulance screen for a scheduled BLS/ALS transport request.",
  },
];

export default function HelpCenterScreen() {
  const { colors } = useTheme();
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
    title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 16,
      padding: 14,
    },
    contactIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#E9FBF3", alignItems: "center", justifyContent: "center" },
    contactTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    contactSubtitle: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    faqQuestion: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.ink, marginRight: 10 },
    faqAnswer: { fontSize: 12.5, color: colors.ink2, marginTop: 10, lineHeight: 18 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  async function openSupportChat() {
    if (!userId) return;
    const channel = await fetchOrCreateOpsChannel(userId);
    router.push(`/chat/${channel.id}`);
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
        <Text style={styles.title}>Help center</Text>
      </View>

      <Pressable style={styles.contactCard} onPress={() => void openSupportChat()}>
        <View style={styles.contactIcon}>
          <LifeBuoy size={18} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactTitle}>Contact support</Text>
          <Text style={styles.contactSubtitle}>Chat with the CuraLink team</Text>
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
                <ChevronDown
                  size={16}
                  color={colors.muted2}
                  style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                />
              </Pressable>
              {isOpen ? <Text style={styles.faqAnswer}>{faq.a}</Text> : null}
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
