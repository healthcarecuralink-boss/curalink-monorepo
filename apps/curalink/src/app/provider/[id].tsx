import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Star, User } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchProviderProfile } from "@curalink/api-client";
import { Card, EmptyState, ErrorState, Skeleton, curalinkFonts, useTheme, type ThemeContextValue } from "@curalink/ui";

function Row({ label, value, colors }: { label: string; value: string; colors: ThemeContextValue["colors"] }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 12.5, color: colors.ink, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

export default function ProviderProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 14 },
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
    title: { fontFamily: curalinkFonts.heading, fontSize: 18, color: colors.ink },
    identityCard: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.navy2, alignItems: "center", justifyContent: "center" },
    name: { fontFamily: curalinkFonts.headingSemibold, fontSize: 16, color: colors.ink },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
    ratingText: { fontSize: 12.5, color: colors.muted2, fontWeight: "600" },
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: colors.ink, marginBottom: 8 },
    bodyText: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
    areaRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
    areaText: { fontSize: 12.5, color: colors.ink2 },
        }),
      [colors],
    );

  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["providerProfile", id],
    queryFn: () => fetchProviderProfile(id),
    enabled: Boolean(id),
  });

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
        <Text style={styles.title}>Provider profile</Text>
      </View>

      {isLoading ? (
        <Skeleton height={140} borderRadius={18} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !detail ? (
        <EmptyState
          icon={<User size={26} color={colors.muted} strokeWidth={1.6} />}
          title="Provider not found"
          body="This profile may have been removed or the link is out of date."
          ctaLabel="Go back"
          onPressCta={() => router.back()}
        />
      ) : (
        <>
          <Card style={styles.identityCard}>
            <View style={styles.avatar}>
              <User size={22} color="#EAF3EE" strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{detail.profile.full_name}</Text>
              {detail.professionalProfile ? (
                <View style={styles.ratingRow}>
                  <Star size={13} color={colors.star} fill={colors.star} />
                  <Text style={styles.ratingText}>
                    {detail.professionalProfile.rating.toFixed(1)} ({detail.professionalProfile.rating_count} reviews)
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          {detail.professionalProfile?.bio ? (
            <Card>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bodyText}>{detail.professionalProfile.bio}</Text>
            </Card>
          ) : null}

          <Card>
            {detail.professionalProfile?.years_experience ? (
              <Row label="Experience" value={`${detail.professionalProfile.years_experience} years`} colors={colors} />
            ) : null}
            {detail.professionalProfile?.service_area ? (
              <View style={styles.areaRow}>
                <MapPin size={14} color={colors.muted2} strokeWidth={1.8} />
                <Text style={styles.areaText}>{detail.professionalProfile.service_area}</Text>
              </View>
            ) : null}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
