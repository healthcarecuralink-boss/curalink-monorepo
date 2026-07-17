import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Salad } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchDietPlansForOwner, useSessionStore } from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";

interface MealEntry {
  time: string;
  meal: string;
}

export default function DietPlanScreen() {
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
        planTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14.5, color: colors.ink },
        planDate: { fontSize: 11, color: colors.muted2, marginTop: 2, marginBottom: 8 },
        mealRow: { flexDirection: "row", gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.divider },
        mealTime: { width: 90, fontSize: 12, fontWeight: "700", color: colors.primaryPress },
        mealName: { flex: 1, fontSize: 12.5, color: colors.ink2 },
        notes: { fontSize: 12, color: colors.muted2, marginTop: 8, fontStyle: "italic" },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;

  const { data: plans } = useQuery({
    queryKey: ["dietPlansForOwner", profileId],
    queryFn: () => fetchDietPlansForOwner(profileId as string),
    enabled: Boolean(profileId),
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
        <Text style={styles.title}>Diet & nutrition plan</Text>
      </View>

      {plans === undefined ? (
        <Skeleton height={100} borderRadius={18} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<Salad size={26} color={colors.primary} strokeWidth={1.6} />}
          title="No diet plan yet"
          body="Your nurse or doctor can add one after a home visit."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {plans.map((plan) => {
            const meals = Array.isArray(plan.meals) ? (plan.meals as unknown as MealEntry[]) : [];
            return (
              <Card key={plan.id}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDate}>{new Date(plan.created_at).toLocaleDateString("en-IN")}</Text>
                {meals.map((meal, i) => (
                  <View key={i} style={styles.mealRow}>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                    <Text style={styles.mealName}>{meal.meal}</Text>
                  </View>
                ))}
                {plan.notes ? <Text style={styles.notes}>{plan.notes}</Text> : null}
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
