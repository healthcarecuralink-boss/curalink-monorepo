import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Sparkles } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchServices } from "@curalink/api-client";
import { Skeleton, curalinkCategoryAccents, curalinkFonts, useTheme } from "@curalink/ui";
import { categoryLabel } from "../../utils/categories";


export default function AllServicesScreen() {
  const { colors } = useTheme();

  const categoryAccent = (category: string) =>
    (curalinkCategoryAccents as Record<string, { fg: string; bg: string }>)[category] ?? {
      fg: colors.navy,
      bg: colors.chipNeutral,
    };
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60 },
    header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
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
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 18,
      padding: 14,
    },
    iconChip: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    name: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14.5, color: colors.ink },
    description: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
        }),
      [colors],
    );
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: () => fetchServices() });

  const categories = Array.from(new Set((services ?? []).map((s) => s.category)));
  const countFor = (category: string) => (services ?? []).filter((s) => s.category === category).length;

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
        <Text style={styles.title}>All services</Text>
      </View>

      <View style={{ gap: 10 }}>
        {services === undefined
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={72} borderRadius={18} delay={i * 80} />)
          : categories.map((category) => {
              const accent = categoryAccent(category);
              return (
                <Pressable key={category} style={styles.categoryRow} onPress={() => router.push(`/category/${category}`)}>
                  <View style={[styles.iconChip, { backgroundColor: accent.bg }]}>
                    <Sparkles size={20} color={accent.fg} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{categoryLabel(category)}</Text>
                    <Text style={styles.description}>{countFor(category)} service{countFor(category) === 1 ? "" : "s"}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted2} strokeWidth={1.8} />
                </Pressable>
              );
            })}
      </View>
    </ScrollView>
  );
}
