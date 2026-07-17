import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import {
  Button,
  Card,
  StatusPill,
  TextField,
  curalinkPlusStatusPillColors,
  roleAccents,
  roleTints,
  useTheme,
} from "@curalink/ui";

const dsSwatches = [
  { name: "Primary teal", hex: "#0F7A5E" },
  { name: "Teal strong", hex: "#128A6B" },
  { name: "Teal press", hex: "#0B5A45" },
  { name: "Amber accent", hex: "#F4A23B" },
  { name: "Ink (text)", hex: "#10192B" },
  { name: "Background", hex: "#F7F8FA" },
  { name: "Error", hex: "#DC3545" },
  { name: "Info (doctor)", hex: "#3B82F6" },
];

export default function DesignSystemScreen() {
  const { colors, type, colorScheme, toggleColorScheme } = useTheme();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.back()}>
          <ArrowLeft size={17} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text style={[type.h3, { color: colors.ink }]}>Design system</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>&ldquo;Clinical Confidence&rdquo; &middot; v1.0</Text>
        </View>
      </View>

      <SectionLabel>Palette</SectionLabel>
      <View style={styles.swatchGrid}>
        {dsSwatches.map((sw) => (
          <View key={sw.hex}>
            <View style={[styles.swatchColor, { backgroundColor: sw.hex }]} />
            <Text style={[styles.swatchName, { color: colors.ink }]}>{sw.name}</Text>
            <Text style={[styles.swatchHex, { color: colors.muted }]}>{sw.hex}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>Role accent colors</SectionLabel>
      <View style={styles.roleRow}>
        {Object.entries(roleAccents).map(([role, hex]) => (
          <View key={role} style={[styles.rolePill, { backgroundColor: roleTints[role as keyof typeof roleTints] }]}>
            <View style={[styles.roleDot, { backgroundColor: hex }]} />
            <Text style={[styles.roleLabel, { color: colors.ink }]}>{role}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>Typography</SectionLabel>
      <Card>
        <Text style={[type.display, { color: colors.ink }]}>Display 28/800</Text>
        <Text style={[type.h1, { color: colors.ink, marginTop: 8 }]}>H1 &middot; 22/800</Text>
        <Text style={[type.h2, { color: colors.ink, marginTop: 8 }]}>H2 &middot; 18/700</Text>
        <Text style={{ fontSize: 14, color: colors.ink2, marginTop: 8 }}>Body &middot; Inter 14/400 -- used for descriptions and copy.</Text>
        <Text style={[type.caption, { color: colors.muted, marginTop: 8 }]}>Caption / Label 11/700</Text>
      </Card>

      <SectionLabel>Buttons</SectionLabel>
      <View style={{ gap: 9 }}>
        <Button label="Primary" variant="primary" onPress={() => {}} />
        <Button label="Secondary" variant="secondary" onPress={() => {}} />
        <Button label="Ghost" variant="ghost" onPress={() => {}} />
        <Button label="Destructive" variant="destructive" onPress={() => {}} />
      </View>

      <SectionLabel>Text fields</SectionLabel>
      <View style={{ gap: 11 }}>
        <TextField placeholder="Default placeholder" />
        <TextField placeholder="Password" isPassword />
      </View>

      <SectionLabel>Status pills</SectionLabel>
      <View style={styles.pillRow}>
        <StatusPill label="Available" {...curalinkPlusStatusPillColors.available} />
        <StatusPill label="On break" {...curalinkPlusStatusPillColors.onBreak} />
        <StatusPill label="En route" {...curalinkPlusStatusPillColors.enRoute} />
        <StatusPill label="Off shift" {...curalinkPlusStatusPillColors.offShift} />
        <StatusPill label="Emergency" {...curalinkPlusStatusPillColors.emergency} />
      </View>

      <SectionLabel>Dark mode</SectionLabel>
      <Card style={styles.darkModeRow}>
        <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.ink }}>Preview dark surfaces</Text>
        <Switch value={colorScheme === "dark"} onValueChange={toggleColorScheme} trackColor={{ true: colors.primary, false: colors.border }} />
      </Card>
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.muted }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 22,
    marginBottom: 10,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  swatchColor: {
    width: 90,
    height: 56,
    borderRadius: 11,
  },
  swatchName: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  swatchHex: {
    fontSize: 10.5,
    fontFamily: "monospace",
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  darkModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
