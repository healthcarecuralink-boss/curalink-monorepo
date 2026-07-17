import { useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, Check, CheckSquare, Minus, Plus, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Button,
  Card,
  EmptyState,
  Skeleton,
  StatusPill,
  TextField,
  Toast,
  curalinkCategoryAccents,
  curalinkColors,
  curalinkStatusPillColors,
  useTheme,
} from "@curalink/ui";

export default function DesignSystemScreen() {
  const { colorScheme, type } = useTheme();
  const colors = curalinkColors[colorScheme];
  const [toastVisible, setToastVisible] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.back()}>
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text style={[type.h3, { color: colors.ink }]}>Design system</Text>
          <Text style={[styles.subtitle, { color: colors.muted2 }]}>&ldquo;Caring Warmth&rdquo; &middot; v1.0</Text>
        </View>
      </View>

      <SectionLabel>Palette</SectionLabel>
      <View style={styles.swatchGrid2}>
        <Swatch color={colors.primary} name="Primary coral" hex={colors.primary} />
        <Swatch color={colors.navy2} name="Secondary sage" hex={colors.navy2} />
        <Swatch color={colors.bg} name="Cream background" hex={colors.bg} bordered />
        <Swatch color={colors.ink} name="Ink text" hex={colors.ink} />
      </View>
      <View style={styles.swatchGrid4}>
        <MiniSwatch color={colors.success} name="Success" />
        <MiniSwatch color={colors.warning} name="Warning" />
        <MiniSwatch color={colors.error} name="Error" />
        <MiniSwatch color={colors.info} name="Info" />
      </View>
      <View style={styles.categoryRow}>
        {Object.entries(curalinkCategoryAccents).map(([key, accent]) => (
          <View key={key} style={[styles.categoryChip, { backgroundColor: accent.bg }]}>
            <Text style={[styles.categoryLabel, { color: accent.fg }]}>{key}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>Typography</SectionLabel>
      <Card>
        <Text style={[type.display, { color: colors.ink }]}>Display</Text>
        <Text style={[type.h1, { color: colors.ink, marginTop: 8 }]}>H1 &middot; Heading</Text>
        <Text style={[type.h2, { color: colors.ink, marginTop: 8 }]}>H2 &middot; Section title</Text>
        <Text style={[type.h3, { color: colors.ink, marginTop: 8 }]}>H3 &middot; Card title</Text>
        <Text style={[type.bodyLarge, { color: colors.ink, marginTop: 8 }]}>Body large &middot; Inter Regular</Text>
        <Text style={[type.body, { color: colors.ink, marginTop: 6 }]}>Body &middot; Inter Regular</Text>
        <Text style={[type.bodySmall, { color: colors.muted, marginTop: 6 }]}>Body small &middot; Inter Regular</Text>
        <Text style={[type.caption, { color: colors.muted2, marginTop: 6 }]}>Caption &middot; Inter Medium</Text>
      </Card>

      <SectionLabel>Buttons</SectionLabel>
      <View style={{ gap: 10 }}>
        <Button label="Primary" variant="primary" onPress={() => {}} />
        <Button label="Secondary" variant="secondary" onPress={() => {}} />
        <Button label="Ghost" variant="ghost" onPress={() => {}} />
        <Button label="Destructive" variant="destructive" onPress={() => {}} />
        <Button variant="primary" disabled label="Disabled" onPress={() => {}} />
        <View style={styles.iconButtonRow}>
          <Button variant="secondary" size="icon" icon={<Plus size={19} color={colors.ink} />} onPress={() => {}} />
          <Button variant="primary" size="icon" icon={<Check size={19} color="#FFFFFF" />} onPress={() => {}} />
          <Button variant="secondary" size="icon" icon={<Trash2 size={19} color={colors.muted} />} onPress={() => {}} />
        </View>
      </View>

      <SectionLabel>Text fields</SectionLabel>
      <View style={{ gap: 11 }}>
        <TextField placeholder="Default placeholder" />
        <TextField placeholder="Phone number" phonePrefix="+91" keyboardType="phone-pad" />
        <TextField placeholder="Password" isPassword />
      </View>

      <SectionLabel>Status pills</SectionLabel>
      <View style={styles.pillRow}>
        <StatusPill label="Pending" {...curalinkStatusPillColors.pending} />
        <StatusPill label="Confirmed" {...curalinkStatusPillColors.confirmed} />
        <StatusPill label="En route" {...curalinkStatusPillColors.enRoute} />
        <StatusPill label="In progress" {...curalinkStatusPillColors.inProgress} />
        <StatusPill label="Completed" {...curalinkStatusPillColors.completed} />
        <StatusPill label="Cancelled" {...curalinkStatusPillColors.cancelled} />
      </View>

      <SectionLabel>Cards</SectionLabel>
      <Card size="large">
        <Text style={[type.h3, { color: colors.ink }]}>Elevated card &middot; 20px radius</Text>
        <Text style={[styles.cardBody, { color: colors.muted2 }]}>
          Subtle 1px border + soft shadow. Used for list items, summaries, provider cards.
        </Text>
      </Card>

      <SectionLabel>Loading skeleton</SectionLabel>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Skeleton />
        <Skeleton delay={200} />
      </View>

      <SectionLabel>Empty state</SectionLabel>
      <EmptyState icon={<CheckSquare size={28} color={colors.primary} strokeWidth={1.6} />} title="Metaphor-driven, never generic" />

      <SectionLabel>Toast</SectionLabel>
      <Pressable
        style={[styles.toastTrigger, { backgroundColor: colors.navy }]}
        onPress={() => {
          setToastVisible(true);
          setTimeout(() => setToastVisible(false), 3000);
        }}
      >
        <Minus size={14} color={colors.bg} />
        <Text style={styles.toastTriggerLabel}>Tap to preview toast (3s auto-dismiss)</Text>
      </Pressable>

      <Text style={[styles.footer, { color: colors.faint }]}>
        8pt spacing scale &middot; Cards 16-20px radius &middot; Buttons 12-14px radius{"\n"}Feather/Lucide line icons
        throughout
      </Text>

      <Toast message="Confirmation toast &middot; 3s auto-dismiss" visible={toastVisible} bottomOffset={24} />
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.faint }]}>{children}</Text>;
}

function Swatch({ color, name, hex, bordered }: { color: string; name: string; hex: string; bordered?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.swatchCard, { borderColor: colors.border2 }]}>
      <View style={[styles.swatchColor, { backgroundColor: color }, bordered && { borderWidth: 1, borderColor: colors.border }]} />
      <View style={styles.swatchLabelWrap}>
        <Text style={[styles.swatchName, { color: colors.ink }]}>{name}</Text>
        <Text style={[styles.swatchHex, { color: colors.muted2 }]}>{hex}</Text>
      </View>
    </View>
  );
}

function MiniSwatch({ color, name }: { color: string; name: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.miniSwatch, { borderColor: colors.border2 }]}>
      <View style={[styles.miniSwatchColor, { backgroundColor: color }]} />
      <Text style={[styles.miniSwatchName, { color: colors.ink }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginTop: 26,
    marginBottom: 12,
  },
  swatchGrid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatchCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  swatchColor: {
    height: 56,
  },
  swatchLabelWrap: {
    padding: 10,
  },
  swatchName: {
    fontSize: 12,
    fontWeight: "700",
  },
  swatchHex: {
    fontSize: 10.5,
    marginTop: 1,
  },
  swatchGrid4: {
    flexDirection: "row",
    gap: 9,
    marginTop: 10,
  },
  miniSwatch: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  miniSwatchColor: {
    height: 38,
  },
  miniSwatchName: {
    fontSize: 9.5,
    fontWeight: "700",
    padding: 7,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  categoryLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  iconButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardBody: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  toastTrigger: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toastTriggerLabel: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#EAF1F7",
  },
  footer: {
    marginTop: 26,
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 18,
  },
});
