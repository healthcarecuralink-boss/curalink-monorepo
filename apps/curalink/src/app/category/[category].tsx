import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchServicesByCategory } from "@curalink/api-client";
import { EmptyState, Skeleton, curalinkCategoryAccents, curalinkFonts, useTheme } from "@curalink/ui";
import { categoryLabel } from "../../utils/categories";

export default function CategoryDetailScreen() {
  const { colors } = useTheme();
  const { category } = useLocalSearchParams<{ category: string }>();

  const accent = useMemo(
    () => (curalinkCategoryAccents as Record<string, { fg: string; bg: string }>)[category] ?? { fg: colors.navy, bg: colors.chipNeutral },
    [category, colors],
  );

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
        serviceCard: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border2,
          borderRadius: 18,
          padding: 16,
          gap: 6,
        },
        iconChip: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 4 },
        name: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: colors.ink },
        description: { fontSize: 12, color: colors.muted2, lineHeight: 17 },
        metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
        price: { fontSize: 13, fontWeight: "700", color: colors.navy2 },
        duration: { fontSize: 11.5, color: colors.muted2 },
        expressBadge: { fontSize: 10.5, fontWeight: "700", color: accent.fg, backgroundColor: accent.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
      }),
    [colors, accent],
  );

  const { data: services } = useQuery({
    queryKey: ["servicesByCategory", category],
    queryFn: () => fetchServicesByCategory(category),
    enabled: Boolean(category),
  });

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
        <Text style={styles.title}>{categoryLabel(category)}</Text>
      </View>

      {services === undefined ? (
        <View style={{ gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={100} borderRadius={18} delay={i * 80} />
          ))}
        </View>
      ) : services.length === 0 ? (
        <EmptyState icon={<Sparkles size={26} color={accent.fg} strokeWidth={1.6} />} title="No services in this category yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {services.map((service) => (
            <Pressable
              key={service.id}
              style={styles.serviceCard}
              onPress={() => router.push({ pathname: "/booking/new", params: { serviceId: service.id } })}
            >
              <View style={[styles.iconChip, { backgroundColor: accent.bg }]}>
                <Sparkles size={18} color={accent.fg} strokeWidth={1.8} />
              </View>
              <Text style={styles.name}>{service.name}</Text>
              {service.description ? <Text style={styles.description}>{service.description}</Text> : null}
              <View style={styles.metaRow}>
                <Text style={styles.price}>from ₹{service.price_from}</Text>
                {service.duration_mins ? <Text style={styles.duration}>{service.duration_mins} mins</Text> : null}
                {service.is_express_eligible ? <Text style={styles.expressBadge}>Express eligible</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
