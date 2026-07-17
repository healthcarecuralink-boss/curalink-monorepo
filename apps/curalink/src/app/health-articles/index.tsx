import { useMemo } from "react";
import { router } from "expo-router";
import { ArrowLeft, ChevronRight, Newspaper } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, curalinkFonts, useTheme } from "@curalink/ui";
import { healthArticles } from "../../data/healthArticles";


export default function HealthArticlesScreen() {
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
    articleCard: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconChip: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#E9FBF3", alignItems: "center", justifyContent: "center" },
    category: { fontSize: 10.5, fontWeight: "700", color: colors.primary, textTransform: "uppercase" },
    articleTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink, marginTop: 2 },
    summary: { fontSize: 11.5, color: colors.muted2, marginTop: 3, lineHeight: 16 },
        }),
      [colors],
    );
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
        <Text style={styles.title}>Health articles</Text>
      </View>

      <View style={{ gap: 10 }}>
        {healthArticles.map((article) => (
          <Pressable key={article.slug} onPress={() => router.push(`/health-articles/${article.slug}`)}>
            <Card style={styles.articleCard}>
              <View style={styles.iconChip}>
                <Newspaper size={18} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.category}>{article.category}</Text>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.summary}>{article.summary}</Text>
              </View>
              <ChevronRight size={16} color={colors.faint2} />
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
