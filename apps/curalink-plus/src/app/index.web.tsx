import { useMemo } from "react";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Heart, Shield, ShieldCheck, Siren, Stethoscope, Store, Users, Wallet } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ProfessionalRole } from "@curalink/api-client";
import { Button, curalinkPlusFonts, roleAccents, roleTints, useTheme } from "@curalink/ui";

// Web-only override of index.tsx (Metro platform resolution -- see
// packages/ui/src/components/LeafletMap.web.tsx for the same pattern). Native
// keeps its splash-then-redirect-to-/login behavior untouched; this is what
// curalinkplus.co.in's root domain actually renders for a logged-out visitor.
export default function WebWelcomeScreen() {
  const { colors, type } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.logoChip}>
            <ShieldCheck size={20} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <Text style={[styles.wordmark, { color: colors.ink }]}>
            CuraLink<Text style={{ color: colors.primary }}>Plus</Text>
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: colors.bg === "#0A1628" ? "rgba(15,122,94,0.16)" : "#E8F5F0" }]}>
          <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.badgeText, { color: colors.primaryPress }]}>Trusted by care partners · Hyderabad</Text>
        </View>

        <Text style={[type.display, styles.h1, { color: colors.ink }]}>
          Home healthcare, delivered with dignity and trust.
        </Text>
        <Text style={[type.body, styles.lead, { color: colors.muted }]}>
          The operations platform for medical partners, doctors, nurses and vet care teams — one calm,
          dependable place to run it all. Always free for partners.
        </Text>

        <View style={styles.heroBtns}>
          <Button label="Sign in" onPress={() => router.push("/login")} />
          <Button label="Apply to join" variant="secondary" onPress={() => router.push("/signup")} />
        </View>

        <View style={styles.trustRow}>
          <TrustItem icon={<ShieldCheck size={16} color={colors.primary} />} label="Always free for partners" colors={colors} />
          <TrustItem icon={<Wallet size={16} color={colors.primary} />} label="No platform fees, ever" colors={colors} />
        </View>
      </View>

      {/* ── Role cards ── */}
      <View style={styles.section}>
        <Text style={[styles.eyebrow, { color: colors.primaryPress }]}>Join as</Text>
        <Text style={[type.h2, { color: colors.ink, marginBottom: 18 }]}>Whichever role fits, we've built for it.</Text>
        <View style={styles.roleGrid}>
          {roleCards.map(({ key, label, description, Icon }) => {
            const accent = roleAccents[key];
            const tint = roleTints[key];
            const staticSlug = staticPageForRole[key];
            return (
              <Pressable
                key={key}
                onPress={() => router.push(staticSlug ? `/login?role=${key}` : "/signup")}
                style={[styles.roleCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <View style={[styles.roleIcon, { backgroundColor: tint }]}>
                  <Icon size={20} color={accent} strokeWidth={2} />
                </View>
                <Text style={[type.h2, styles.roleLabel, { color: colors.ink }]}>{label}</Text>
                <Text style={[type.bodySmall, { color: colors.muted }]}>{description}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={[styles.ctaSection, { backgroundColor: colors.ink }]}>
        <Text style={[type.h2, { color: "#FFFFFF", textAlign: "center" }]}>Ready to bring your team on board?</Text>
        <Button label="Sign in" onPress={() => router.push("/login")} style={{ marginTop: 20, alignSelf: "center" }} />
      </View>

      {/* ── Footer ── */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.footerCols}>
          <FooterCol
            title="Partners"
            colors={colors}
            links={[
              ["Medical Partners", "/for-partners"],
              ["Doctors", "/for-doctors"],
              ["Nurses", "/for-nurses"],
              ["Vet Nurses", "/for-vets"],
            ]}
          />
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
        <Text style={[styles.footerCopy, { color: colors.muted }]}>© 2025 Curalink Healthcare Pvt. Ltd. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const roleCards: { key: ProfessionalRole; label: string; description: string; Icon: typeof Heart }[] = [
  { key: "nurse", label: "Nurse", description: "Steady patient flow, your own schedule.", Icon: Heart },
  { key: "doctor", label: "Doctor", description: "Home-recovery plans, remote consults.", Icon: Stethoscope },
  { key: "vet", label: "Vet Nurse", description: "Home visits for pets across Hyderabad.", Icon: Shield },
  { key: "admin", label: "Partner Admin", description: "Manage a team of professionals.", Icon: Users },
  { key: "pharmacy", label: "Pharmacy Partner", description: "Fulfill medicine orders nearby.", Icon: Store },
  { key: "ambulance", label: "Ambulance Partner", description: "Respond to emergency dispatch.", Icon: Siren },
];

// Roles with a dedicated static landing page get sent through /login?role=
// (skips the picker, matches login.tsx's existing role param handling); the
// rest go to the /signup role picker like the footer's existing pattern.
const staticPageForRole: Partial<Record<ProfessionalRole, string>> = {
  nurse: "/for-nurses",
  doctor: "/for-doctors",
  vet: "/for-vets",
};

function TrustItem({ icon, label, colors }: { icon: React.ReactNode; label: string; colors: Record<string, string> }) {
  return (
    <View style={trustStyles.item}>
      {icon}
      <Text style={[trustStyles.label, { color: colors.muted }]}>{label}</Text>
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
      <Text style={[footerColStyles.title, { color: colors.muted }]}>{title}</Text>
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
    logoChip: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#0F7A5E", alignItems: "center", justifyContent: "center" },
    wordmark: { fontFamily: curalinkPlusFonts.heading, fontSize: 19 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      borderRadius: 100,
      paddingVertical: 7,
      paddingHorizontal: 14,
      marginBottom: 20,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontSize: 12.5, fontWeight: "700" },
    h1: { marginBottom: 16, fontSize: 34, lineHeight: 40 },
    lead: { marginBottom: 28, lineHeight: 22, maxWidth: 560 },
    heroBtns: { flexDirection: "row", gap: 12, marginBottom: 28 },
    trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
    section: { paddingHorizontal: 24, paddingVertical: 48, maxWidth: 960, alignSelf: "center", width: "100%" },
    eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 },
    roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    roleCard: { width: 220, borderWidth: 1.5, borderRadius: 16, padding: 18 },
    roleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    roleLabel: { marginBottom: 6, fontSize: 16 },
    ctaSection: { paddingHorizontal: 24, paddingVertical: 56, alignItems: "center" },
    footer: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 30, borderTopWidth: 1 },
    footerCols: { flexDirection: "row", flexWrap: "wrap", gap: 32, maxWidth: 960, alignSelf: "center", width: "100%", marginBottom: 24 },
    footerCopy: { fontSize: 12, textAlign: "center" },
  });
}
