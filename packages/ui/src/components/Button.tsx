import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { minTapTarget } from "../tokens/shared";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "default" | "icon";

export interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  // Layout-only overrides (margin, alignSelf, width, flex, ...) applied on
  // top of the variant's own visual styles -- not a full style escape hatch.
  style?: StyleProp<ViewStyle>;
}

// Primary (filled, shadow) / secondary (outline) / ghost (text-only) /
// destructive (outline, error-tinted) -- states: default / pressed (scale
// .98 + darker fill) / disabled (flat, no shadow). Matches both apps' design
// systems; CuraLink Plus just has fewer shadow tokens ("minimal shadows").
export function Button({
  label,
  variant = "primary",
  size = "default",
  icon,
  loading,
  disabled,
  style,
  ...pressableProps
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const isIconOnly = size === "icon";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: radius.button,
          height: isIconOnly ? Math.max(minTapTarget, 44) : 50,
          width: isIconOnly ? Math.max(minTapTarget, 44) : undefined,
          paddingHorizontal: isIconOnly ? 0 : 20,
        },
        variantStyle(variant, colors, Boolean(disabled)),
        pressed && !disabled && pressedStyle(variant, colors),
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "destructive" ? "#FFFFFF" : colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon}
          {label ? (
            <Text
              style={[
                styles.label,
                { color: labelColor(variant, colors, Boolean(disabled)) },
              ]}
            >
              {label}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

function variantStyle(variant: ButtonVariant, colors: Record<string, string>, disabled: boolean) {
  if (disabled && (variant === "primary" || variant === "destructive")) {
    return { backgroundColor: colors.track ?? colors.border };
  }
  switch (variant) {
    case "primary":
      return { backgroundColor: colors.primary };
    case "secondary":
      return { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border };
    case "ghost":
      return { backgroundColor: "transparent" };
    case "destructive":
      return { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.error };
  }
}

function pressedStyle(variant: ButtonVariant, colors: Record<string, string>) {
  if (variant === "primary") {
    return { backgroundColor: colors.primaryPress ?? colors.primary, transform: [{ scale: 0.98 }] };
  }
  return { transform: [{ scale: 0.98 }] };
}

function labelColor(variant: ButtonVariant, colors: Record<string, string>, disabled: boolean) {
  if (disabled && (variant === "primary" || variant === "destructive")) {
    return colors.faint ?? colors.muted;
  }
  switch (variant) {
    case "primary":
      return "#FFFFFF";
    case "secondary":
      return colors.ink;
    case "ghost":
      return colors.primary;
    case "destructive":
      return colors.error;
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14.5,
    fontWeight: "700",
  },
});
