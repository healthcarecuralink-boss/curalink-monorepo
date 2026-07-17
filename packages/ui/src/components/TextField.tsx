import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { iconStrokeWidth } from "../tokens/shared";

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  // Shows a "🇮🇳 +91" prefix chip, matching the design system's phone field.
  phonePrefix?: string;
  // Adds an eye/eye-off toggle instead of relying on the OS's own reveal UI.
  isPassword?: boolean;
}

export function TextField({ label, error, phonePrefix, isPassword, style, ...inputProps }: TextFieldProps) {
  const { colors, radius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.muted }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          {
            borderRadius: radius.card ?? 14,
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
          },
          isFocused && { shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 3, elevation: 1 },
        ]}
      >
        {phonePrefix ? (
          <View style={[styles.prefix, { borderRightColor: colors.border }]}>
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={[styles.prefixText, { color: colors.ink }]}>{phonePrefix}</Text>
          </View>
        ) : null}
        <TextInput
          style={[styles.input, { color: colors.ink }, style]}
          placeholderTextColor={colors.faint ?? colors.muted}
          secureTextEntry={isPassword && !isRevealed}
          onFocus={(e) => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable onPress={() => setIsRevealed((v) => !v)} hitSlop={8}>
            {isRevealed ? (
              <EyeOff size={18} color={colors.muted} strokeWidth={iconStrokeWidth.default} />
            ) : (
              <Eye size={18} color={colors.muted} strokeWidth={iconStrokeWidth.default} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  field: {
    height: 52,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    height: "100%",
  },
  prefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 12,
    borderRightWidth: 1,
  },
  flag: {
    fontSize: 14,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: "600",
  },
  error: {
    fontSize: 11.5,
    fontWeight: "500",
  },
});
