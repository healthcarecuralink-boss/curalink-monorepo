import { AlertTriangle } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
}

// Same shape as EmptyState (metaphor-driven, tinted icon chip + heading +
// muted body), but for a failed query rather than a genuinely-empty list --
// these were being conflated before (a failed fetch just showed an
// indefinite loading skeleton with no way to recover without reloading).
export function ErrorState({ title = "Something went wrong", body, onRetry }: ErrorStateProps) {
  const { colors, radius, type } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border2 ?? colors.border, borderRadius: radius.cardLarge ?? radius.card },
      ]}
      accessibilityRole="alert"
    >
      <View style={[styles.iconChip, { backgroundColor: colors.errorTint ?? colors.border }]}>
        <AlertTriangle size={26} color={colors.error} strokeWidth={1.6} />
      </View>
      <Text style={[styles.title, type.h3, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{body ?? "Please check your connection and try again."}</Text>
      {onRetry ? (
        <View style={styles.cta}>
          <Button label="Try again" variant="secondary" onPress={onRetry} accessibilityLabel="Retry" />
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
