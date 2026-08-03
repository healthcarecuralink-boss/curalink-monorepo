import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { ArrowLeft, Check, Copy, Gift, Share2, Users } from "lucide-react-native";
import { Platform, Pressable, Share, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchMyReferralCode, fetchMyReferrals, useSessionStore } from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";

export default function ReferAFriendScreen() {
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
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
        heroCard: { alignItems: "center", gap: 10, backgroundColor: colors.primary, paddingVertical: 26 },
        heroTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: "#FFFFFF", textAlign: "center" },
        heroBody: { fontSize: 12, color: "rgba(255,255,255,0.85)", textAlign: "center", paddingHorizontal: 20 },
        codeChip: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 13, paddingHorizontal: 18, paddingVertical: 12 },
        codeText: { fontFamily: curalinkFonts.heading, fontSize: 22, color: "#FFFFFF", letterSpacing: 3 },
        copiedText: { fontSize: 11.5, fontWeight: "700", color: "#FFFFFF" },
        referralRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        referralMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;

  const { data: code } = useQuery({
    queryKey: ["myReferralCode", profileId],
    queryFn: () => fetchMyReferralCode(profileId as string),
    enabled: Boolean(profileId),
  });
  const { data: referrals } = useQuery({
    queryKey: ["myReferrals", profileId],
    queryFn: () => fetchMyReferrals(profileId as string),
    enabled: Boolean(profileId),
  });

  const [justCopied, setJustCopied] = useState(false);

  async function handleCopy() {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }

  async function handleShare() {
    if (!code) return;
    const message = `Join me on CuraLink for home healthcare in Hyderabad — use my code ${code} when you sign up!`;
    if (Platform.OS === "web") {
      const nav = (globalThis as { navigator?: { share?: (data: { text: string }) => Promise<void> } }).navigator;
      if (nav?.share) {
        await nav.share({ text: message });
        return;
      }
      await handleCopy();
      return;
    }
    await Share.share({ message });
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
        <Text style={styles.title}>Refer a friend</Text>
      </View>

      <Card style={styles.heroCard}>
        <Gift size={28} color="#FFFFFF" strokeWidth={1.6} />
        <Text style={styles.heroTitle}>Give 50 points, get 50 points</Text>
        <Text style={styles.heroBody}>When a friend signs up with your code, you both earn 50 loyalty points.</Text>
        {code ? (
          <Pressable style={styles.codeChip} onPress={() => void handleCopy()}>
            <Text style={styles.codeText}>{code}</Text>
            {justCopied ? (
              <Check size={18} color="#FFFFFF" strokeWidth={1.8} />
            ) : (
              <Copy size={18} color="#FFFFFF" strokeWidth={1.8} />
            )}
          </Pressable>
        ) : (
          <Skeleton height={48} width={160} borderRadius={13} />
        )}
        {justCopied ? <Text style={styles.copiedText}>Copied!</Text> : null}
        <Button label="Share your code" variant="secondary" icon={<Share2 size={16} color={colors.ink} />} onPress={() => void handleShare()} />
      </Card>

      <Text style={styles.sectionTitle}>Friends you&apos;ve referred</Text>
      {referrals === undefined ? (
        <Skeleton height={70} borderRadius={16} />
      ) : referrals.length === 0 ? (
        <EmptyState icon={<Users size={26} color={colors.primary} strokeWidth={1.6} />} title="No referrals yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {referrals.map((referral) => (
            <Card key={referral.id} style={styles.referralRow}>
              <Users size={16} color={colors.primary} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Friend joined</Text>
                <Text style={styles.referralMeta}>{new Date(referral.created_at).toLocaleDateString("en-IN")}</Text>
              </View>
              {referral.reward_granted ? <Text style={{ color: colors.primary, fontWeight: "700" }}>+50 pts</Text> : null}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
