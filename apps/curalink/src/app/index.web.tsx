import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { HeartPulse, ShieldCheck, Clock, Wallet } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchServices } from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, curalinkCategoryAccents, curalinkFonts, useTheme } from "@curalink/ui";

// Web-only override of index.tsx (Metro platform resolution -- see
// packages/ui/src/components/LeafletMap.web.tsx for the same pattern). Native
// keeps its splash-then-redirect-to-/auth behavior untouched; this is what
// curalink.co.in's root domain actually renders for a logged-out visitor --
// the real app's own welcome screen, not a separate marketing page. Signed-in
// visitors still land on /(tabs)/home via index.tsx on their next app open;
// this screen itself doesn't need to check session -- its only job is to get
// someone to /auth.
export default function WebWelcomeScreen() {
  const { colors, type } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data: services, isLoading, isError } = useQuery({
    queryKey: ["services", "public"],
    queryFn: fetchServices,
  });

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.logoChip}>
            <HeartPulse size={22} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <Text style={[styles.wordmark, { color: colors.ink }]}>CuraLink</Text>
        </View>

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Launching soon across India</Text>
        </View>

        <Text style={[type.display, styles.h1, { color: colors.ink }]}>
          Healthcare that comes home — and stays with you.
        </Text>
        <Text style={[type.bodyLarge, styles.lead, { color: colors.muted }]}>
          Licensed, background-checked professionals at your door in minutes. Book a nurse, doctor,
          lab test or physiotherapist, and track everything from one calm dashboard.
        </Text>

        <View style={styles.heroBtns}>
          <Button label="Get started" onPress={() => router.push("/auth")} style={styles.heroBtnPrimary} />
          <Button
            label="Sign in"
            variant="secondary"
            onPress={() => router.push({ pathname: "/auth", params: { mode: "login" } })}
          />
        </View>

        <View style={styles.trustRow}>
          <TrustItem icon={<ShieldCheck size={16} color={colors.primaryPress} />} label="100% verified professionals" colors={colors} />
          <TrustItem icon={<Wallet size={16} color={colors.primaryPress} />} label="Pay only after care" colors={colors} />
          <TrustItem icon={<Clock size={16} color={colors.primaryPress} />} label="Most visits within 60 min" colors={colors} />
        </View>
      </View>

      {/* ── Services (live data) ── */}
      <View style={styles.section} nativeID="services">
        <Text style={styles.eyebrow}>Services</Text>
        <Text style={[type.h2, { color: colors.ink, marginBottom: 18 }]}>Real care, booked in minutes.</Text>

        {isLoading ? (
          <View style={styles.serviceGrid}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={220} height={140} borderRadius={18} delay={i * 120} />
            ))}
          </View>
        ) : isError || !services || services.length === 0 ? (
          <EmptyState
            icon={<HeartPulse size={26} color={colors.primary} strokeWidth={1.6} />}
            title="Services will appear here once we're live in your city."
          />
        ) : (
          <View style={styles.serviceGrid}>
            {services.slice(0, 8).map((service) => {
              const accent =
                curalinkCategoryAccents[service.category as keyof typeof curalinkCategoryAccents] ??
                curalinkCategoryAccents.lab;
              return (
                <Pressable key={service.id} onPress={() => router.push("/auth")}>
                  <Card style={styles.serviceCard}>
                    <View style={[styles.serviceIcon, { backgroundColor: accent.bg }]}>
                      <HeartPulse size={18} color={accent.fg} strokeWidth={2} />
                    </View>
                    <Text style={[type.h3, { color: colors.ink }]}>{service.name}</Text>
                    {service.description ? (
                      <Text style={[type.bodySmall, styles.serviceDesc, { color: colors.muted }]} numberOfLines={2}>
                        {service.description}
                      </Text>
                    ) : null}
                    <Text style={[styles.servicePrice, { color: colors.primaryPress }]}>
                      From ₹{Math.round(service.price_from)}
                    </Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* ── How it works ── */}
      <View style={[styles.section, styles.sectionDark, { backgroundColor: colors.navy }]} nativeID="how">
        <Text style={[styles.eyebrow, { color: colors.primary }]}>How it works</Text>
        <Text style={[type.h2, { color: "#FFFFFF", marginBottom: 18 }]}>Care in three calm steps.</Text>
        <View style={styles.stepsRow}>
          <Step n="01" title="Tell us what you need" body="Pick a service, confirm your address, and we match you with a verified professional nearby." />
          <Step n="02" title="Track them to your door" body="Watch them arrive live, with updates the whole way." />
          <Step n="03" title="Get cared for at home" body="Receive expert care, pay only when you're happy." />
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={styles.ctaSection}>
        <Text style={[type.h2, { color: colors.ink, textAlign: "center" }]}>
          Be there for your family. We'll be there for you.
        </Text>
        <Button label="Get started" onPress={() => router.push("/auth")} style={{ marginTop: 20, alignSelf: "center" }} />
      </View>

      {/* ── Footer ── */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.footerCols}>
          <FooterCol
            title="Services"
            colors={colors}
            links={[
              ["IV Therapy", "/services/iv-therapy"],
              ["Elder Care", "/services/elder-care"],
              ["Physiotherapy", "/services/physiotherapy"],
              ["Lab Tests", "/services/lab-tests"],
            ]}
          />
          <FooterCol title="Company" colors={colors} links={[["Hyderabad", "/hyderabad"]]} />
          <FooterCol
            title="Legal"
            colors={colors}
            onPressLinks={[
              ["Privacy Policy", () => router.push("/privacy")],
              ["Terms of Service", () => router.push("/terms")],
              ["Contact Us", () => Linking.openURL("mailto:healthcarecuralink@gmail.com")],
            ]}
          />
        </View>
        <Text style={[styles.footerCopy, { color: colors.faint }]}>© 2025 Curalink · Rapid Home Healthcare · India</Text>
      </View>
    </ScrollView>
  );
}

function TrustItem({ icon, label, colors }: { icon: React.ReactNode; label: string; colors: Record<string, string> }) {
  return (
    <View style={trustStyles.item}>
      {icon}
      <Text style={[trustStyles.label, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={stepStyles.step}>
      <Text style={stepStyles.num}>{n}</Text>
      <Text style={stepStyles.title}>{title}</Text>
      <Text style={stepStyles.body}>{body}</Text>
    </View>
  );
}

function FooterCol({
  title,
  links,
  onPressLinks,
  colors,
}: {
  title: string;
  colors: Record<string, string>;
  links?: [string, string][];
  onPressLinks?: [string, () => void][];
}) {
  return (
    <View style={{ minWidth: 140 }}>
      <Text style={[footerColStyles.title, { color: colors.faint }]}>{title}</Text>
      {links?.map(([label, url]) => (
        <Pressable key={label} onPress={() => Linking.openURL(url)}>
          <Text style={[footerColStyles.link, { color: colors.muted }]}>{label}</Text>
        </Pressable>
      ))}
      {onPressLinks?.map(([label, onPress]) => (
        <Pressable key={label} onPress={onPress}>
          <Text style={[footerColStyles.link, { color: colors.muted }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const trustStyles = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "center", gap: 7 },
  label: { fontSize: 13.5, fontWeight: "500" },
});

const stepStyles = StyleSheet.create({
  step: { flex: 1, minWidth: 220 },
  num: { color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: "800", marginBottom: 8 },
  title: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  body: { color: "rgba(255,255,255,0.6)", fontSize: 13.5, lineHeight: 20 },
});

const footerColStyles = StyleSheet.create({
  title: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 },
  link: { fontSize: 13.5, marginBottom: 9 },
});

function makeStyles(colors: Record<string, string>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    hero: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40, maxWidth: 720, alignSelf: "center", width: "100%" },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
    logoChip: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    wordmark: { fontFamily: curalinkFonts.heading, fontSize: 20 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      backgroundColor: colors.successTint,
      borderRadius: 100,
      paddingVertical: 7,
      paddingHorizontal: 14,
      marginBottom: 20,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    badgeText: { fontSize: 12.5, fontWeight: "700", color: colors.primaryPress },
    h1: { marginBottom: 16, fontSize: 40, lineHeight: 44 },
    lead: { marginBottom: 28, lineHeight: 26, maxWidth: 540 },
    heroBtns: { flexDirection: "row", gap: 12, marginBottom: 28 },
    heroBtnPrimary: { paddingHorizontal: 26 },
    trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
    section: { paddingHorizontal: 24, paddingVertical: 48, maxWidth: 960, alignSelf: "center", width: "100%" },
    sectionDark: { maxWidth: "100%", borderRadius: 0 },
    eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", color: colors.primaryPress, marginBottom: 10 },
    serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    serviceCard: { width: 220 },
    serviceSkeleton: { width: 220, height: 140, borderRadius: 18 },
    serviceIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    serviceDesc: { marginTop: 6, lineHeight: 18 },
    servicePrice: { marginTop: 10, fontSize: 13.5, fontWeight: "700" },
    stepsRow: { flexDirection: "row", flexWrap: "wrap", gap: 32 },
    ctaSection: { paddingHorizontal: 24, paddingVertical: 56, alignItems: "center" },
    footer: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 30, borderTopWidth: 1 },
    footerCols: { flexDirection: "row", flexWrap: "wrap", gap: 32, maxWidth: 960, alignSelf: "center", width: "100%", marginBottom: 24 },
    footerCopy: { fontSize: 12, textAlign: "center" },
  });
}
