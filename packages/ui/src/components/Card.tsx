import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export interface CardProps extends ViewProps {
  size?: "default" | "large";
  elevated?: boolean;
}

export function Card({ size = "default", elevated = true, style, ...viewProps }: CardProps) {
  const { colors, radius, colorScheme } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border2 ?? colors.border,
          borderRadius: size === "large" ? (radius.cardLarge ?? radius.card) : radius.card,
        },
        elevated && colorScheme === "light" && shadowStyle,
        style,
      ]}
      {...viewProps}
    />
  );
}

const shadowStyle = {
  shadowColor: "#0B1D2E",
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    padding: 16,
  },
});
