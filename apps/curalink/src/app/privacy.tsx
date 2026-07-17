import { useMemo } from "react";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PRIVACY_POLICY, PRIVACY_POLICY_EFFECTIVE_DATE, PRIVACY_POLICY_TITLE } from "@curalink/api-client";
import { curalinkFonts, useTheme } from "@curalink/ui";

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
        header: { flexDirection: "row", alignItems: "center", gap: 12 },
        backButton: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
        effectiveDate: { fontSize: 11.5, color: colors.muted2, marginTop: -8 },
        sectionHeading: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink, marginBottom: 6 },
        sectionBody: { fontSize: 13, color: colors.ink2, lineHeight: 20 },
      }),
    [colors],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>{PRIVACY_POLICY_TITLE}</Text>
      </View>
      <Text style={styles.effectiveDate}>Effective {PRIVACY_POLICY_EFFECTIVE_DATE}</Text>

      {PRIVACY_POLICY.map((section) => (
        <View key={section.heading}>
          <Text style={styles.sectionHeading}>{section.heading}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
