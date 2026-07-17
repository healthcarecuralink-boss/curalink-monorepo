import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { curalinkFonts, useTheme } from "@curalink/ui";
import { healthArticles } from "../../data/healthArticles";


export default function HealthArticleDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 10 },
    header: { flexDirection: "row", alignItems: "center" },
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
    category: { fontSize: 11, fontWeight: "700", color: colors.primary, textTransform: "uppercase", marginTop: 8 },
    title: { fontFamily: curalinkFonts.heading, fontSize: 21, color: colors.ink, marginTop: 4 },
    body: { fontSize: 14, color: colors.ink2, lineHeight: 22, marginTop: 8 },
        }),
      [colors],
    );
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const article = healthArticles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>Article not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
      </View>
      <Text style={styles.category}>{article.category}</Text>
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.body}>{article.body}</Text>
    </ScrollView>
  );
}
