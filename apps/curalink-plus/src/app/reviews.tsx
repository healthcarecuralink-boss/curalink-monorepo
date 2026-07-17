import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchAmbulanceRequestReviews,
  fetchBookingReviews,
  fetchPharmacyOrderReviews,
  fetchProfessionalProfile,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";


interface ReviewRow {
  id: string;
  rating: number | null;
  review: string | null;
  updated_at: string;
}

export default function ReviewsScreen() {
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
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink },
    summaryCard: { alignItems: "center", gap: 2 },
    summaryRating: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    summaryCount: { fontSize: 11.5, color: colors.muted },
    reviewBody: { fontSize: 13, color: colors.ink, lineHeight: 18 },
    reviewDate: { fontSize: 10.5, color: colors.muted },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const activeRole = useSessionStore((s) => s.activeRole);
  const userId = session?.user.id;

  const { data: professionalProfile } = useQuery({
    queryKey: ["professionalProfile", userId],
    queryFn: () => fetchProfessionalProfile(userId as string),
    enabled: Boolean(userId),
  });

  const { data: bookingReviews } = useQuery({
    queryKey: ["bookingReviews", userId],
    queryFn: () => fetchBookingReviews(userId as string),
    enabled: Boolean(userId) && (activeRole === "nurse" || activeRole === "vet" || activeRole === "doctor"),
  });
  const { data: pharmacyReviews } = useQuery({
    queryKey: ["pharmacyOrderReviews", userId],
    queryFn: () => fetchPharmacyOrderReviews(userId as string),
    enabled: Boolean(userId) && activeRole === "pharmacy",
  });
  const { data: ambulanceReviews } = useQuery({
    queryKey: ["ambulanceRequestReviews", userId],
    queryFn: () => fetchAmbulanceRequestReviews(userId as string),
    enabled: Boolean(userId) && activeRole === "ambulance",
  });

  const reviews: ReviewRow[] | undefined =
    activeRole === "pharmacy" ? pharmacyReviews : activeRole === "ambulance" ? ambulanceReviews : bookingReviews;

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
        <Text style={styles.title}>Reviews</Text>
      </View>

      {professionalProfile ? (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryRating}>★ {professionalProfile.rating.toFixed(1)}</Text>
          <Text style={styles.summaryCount}>{professionalProfile.rating_count} reviews</Text>
        </Card>
      ) : null}

      {activeRole === "admin" ? (
        <EmptyState icon={<Star size={26} color={colors.primary} strokeWidth={1.6} />} title="No reviews for admin accounts" />
      ) : reviews === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={<Star size={26} color={colors.primary} strokeWidth={1.6} />} title="No reviews yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {reviews.map((row) => (
            <Card key={row.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", gap: 3 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} color={colors.primary} fill={i < (row.rating ?? 0) ? colors.primary : "transparent"} />
                ))}
              </View>
              {row.review ? <Text style={styles.reviewBody}>{row.review}</Text> : null}
              <Text style={styles.reviewDate}>{new Date(row.updated_at).toLocaleDateString("en-IN")}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
