import { useMemo } from "react";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TERMS_OF_SERVICE, TERMS_OF_SERVICE_EFFECTIVE_DATE, TERMS_OF_SERVICE_TITLE } from "@curalink/api-client";
import { curalinkPlusFonts, useTheme } from "@curalink/ui";

export default function TermsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
        header: { flexDirection: "row", alignItems: "center", gap: 12 },
        backButton: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 19, color: colors.ink },
        effectiveDate: { fontSize: 11.5, color: colors.muted, marginTop: -8 },
        sectionHeading: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 13.5, color: colors.ink, marginBottom: 6 },
        sectionBody: { fontSize: 12.5, color: colors.ink, opacity: 0.85, lineHeight: 19 },
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
        <Text style={styles.title}>{TERMS_OF_SERVICE_TITLE}</Text>
      </View>
      <Text style={styles.effectiveDate}>Effective {TERMS_OF_SERVICE_EFFECTIVE_DATE}</Text>

      {TERMS_OF_SERVICE.map((section) => (
        <View key={section.heading}>
          <Text style={styles.sectionHeading}>{section.heading}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
