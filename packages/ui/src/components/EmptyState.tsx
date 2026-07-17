import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}

// "Metaphor-driven, never generic" (design spec) -- circular tinted icon +
// heading + muted body + optional CTA.
export function EmptyState({ icon, title, body, ctaLabel, onPressCta }: EmptyStateProps) {
  const { colors, radius, type } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border2 ?? colors.border, borderRadius: radius.cardLarge ?? radius.card },
      ]}
    >
      <View style={[styles.iconChip, { backgroundColor: colors.chipNeutral ?? colors.bg }]}>{icon}</View>
      <Text style={[styles.title, type.h3, { color: colors.ink }]}>{title}</Text>
      {body ? <Text style={[styles.body, { color: colors.muted }]}>{body}</Text> : null}
      {ctaLabel ? (
        <View style={styles.cta}>
          <Button label={ctaLabel} variant="secondary" onPress={onPressCta} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  iconChip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 12,
    textAlign: "center",
  },
  body: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  cta: {
    marginTop: 16,
  },
});
