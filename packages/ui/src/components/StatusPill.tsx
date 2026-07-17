import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export interface StatusPillProps {
  label: string;
  // App-level code picks these from its own status-color map (see
  // curalinkStatusPillColors / curalinkPlusStatusPillColors) since the
  // fg/bg pairs are bespoke per status, not derived from shared tokens.
  fg: string;
  bg: string;
}

export function StatusPill({ label, fg, bg }: StatusPillProps) {
  const { radius } = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderRadius: radius.pill }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  label: {
    fontSize: 11.5,
    fontWeight: "700",
  },
});
