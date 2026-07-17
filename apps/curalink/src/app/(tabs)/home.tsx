import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Check,
  Clock,
  HeartHandshake,
  MapPin,
  MessageCircleHeart,
  Siren,
  Sparkles,
  Zap,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchActiveBooking, fetchBookAgain, fetchServices, useSessionStore } from "@curalink/api-client";
import { Card, ErrorState, Skeleton, curalinkCategoryAccents, curalinkFonts, useTheme } from "@curalink/ui";


export default function HomeScreen() {
  const { colors, type } = useTheme();

  const categoryAccent = (category: string) =>
    (curalinkCategoryAccents as Record<string, { fg: string; bg: string }>)[category] ?? {
      fg: colors.navy,
      bg: colors.chipNeutral,
    };

  const healthTiles = [
    { key: "vitals", label: "Vitals", description: "Blood pressure, sugar, more", fg: colors.info, bg: colors.infoTint, route: "/vitals" },
    { key: "care-plan", label: "Care plan", description: "Your recovery timeline", fg: colors.success, bg: colors.successTint, route: "/care-plan" },
    { key: "medical-team", label: "Medical team", description: "Your care coordinator", fg: colors.navy, bg: colors.chipNeutral, route: "/medical-team" },
    { key: "lab-reports", label: "Lab reports", description: "Test results & history", fg: colors.navy, bg: colors.chipNeutral, route: "/lab-orders" },
    { key: "insurance", label: "Insurance", description: "Claims & coverage", fg: colors.info, bg: colors.infoTint, route: "/insurance" },
    { key: "chronic-care", label: "Chronic care", description: "Ongoing programs", fg: colors.warning, bg: colors.warningTint, route: "/care-programs" },
  ] as const;
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingTop: 66,
      paddingHorizontal: 20,
      paddingBottom: 110,
      gap: 14,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    greeting: {
      fontFamily: curalinkFonts.heading,
      fontSize: 21,
      color: colors.ink,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 4,
    },
    locationText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: colors.muted,
    },
    headerButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sosButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: 42,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: colors.error,
    },
    sosButtonText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    bellButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: "#EFE4D8",
      alignItems: "center",
      justifyContent: "center",
    },
    assistantBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 18,
      padding: 14,
    },
    assistantIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    assistantTitle: {
      fontFamily: curalinkFonts.headingSemibold,
      fontSize: 14,
      color: colors.ink,
    },
    assistantSubtitle: {
      fontSize: 11.5,
      color: colors.muted2,
      marginTop: 2,
    },
    hero: {
      borderRadius: 22,
      padding: 19,
      backgroundColor: colors.primary,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.16)",
      borderRadius: 99,
      paddingHorizontal: 11,
      paddingVertical: 5,
    },
    heroPulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#EAFBF3",
    },
    heroBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      letterSpacing: 1,
      color: "#FFFFFF",
    },
    heroHeadline: {
      fontFamily: curalinkFonts.heading,
      fontSize: 22,
      color: "#FFFFFF",
      marginTop: 12,
      lineHeight: 26,
    },
    heroMetaRow: {
      flexDirection: "row",
      gap: 14,
      marginTop: 12,
    },
    heroMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    heroMetaText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    heroCta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 50,
      borderRadius: 13,
      backgroundColor: "#FFFFFF",
      marginTop: 16,
    },
    heroCtaText: {
      fontFamily: curalinkFonts.heading,
      fontSize: 15,
      color: colors.primaryPress,
    },
    activeCard: {
      borderRadius: 22,
      padding: 18,
      backgroundColor: colors.navy,
      gap: 8,
    },
    activeBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#00E392",
    },
    activeBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: "#9FE7C6",
    },
    activeService: {
      fontFamily: curalinkFonts.headingSemibold,
      fontSize: 16,
      color: "#FFFFFF",
    },
    trackPill: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.14)",
      borderRadius: 99,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    trackPillText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
    },
    seeAll: {
      fontSize: 12.5,
      fontWeight: "700",
      color: colors.primary,
    },
    serviceGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 13,
    },
    serviceTile: {
      width: "47%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 20,
      padding: 16,
    },
    serviceIconChip: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    serviceTitle: {
      fontFamily: curalinkFonts.headingSemibold,
      fontSize: 14.5,
      color: colors.ink,
    },
    serviceSubtitle: {
      fontSize: 11.5,
      color: colors.muted2,
      marginTop: 4,
      lineHeight: 15,
    },
    servicePrice: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.navy2,
      marginTop: 8,
    },
    skeletonGrid: {
      flexDirection: "row",
      gap: 10,
    },
    providerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
    },
    providerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: colors.navy2,
      alignItems: "center",
      justifyContent: "center",
    },
    providerInitials: {
      fontFamily: curalinkFonts.heading,
      fontSize: 14,
      color: "#EAF3EE",
    },
    providerName: {
      fontFamily: curalinkFonts.headingSemibold,
      fontSize: 14,
      color: colors.ink,
    },
    providerMeta: {
      fontSize: 11.5,
      color: colors.muted2,
      marginTop: 2,
    },
    ratingPill: {
      backgroundColor: colors.chipNeutral,
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    ratingText: {
      fontSize: 11.5,
      fontWeight: "700",
      color: colors.ink,
    },
    healthTile: {
      width: "47%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 20,
      padding: 14,
    },
    healthIconChip: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    healthLabel: {
      fontFamily: curalinkFonts.headingSemibold,
      fontSize: 13.5,
      color: colors.ink,
    },
    healthDescription: {
      fontSize: 11,
      color: colors.muted2,
      marginTop: 2,
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: "#E9FBF3",
      borderColor: "#CFF3E2",
    },
    tipIconChip: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    tipTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.navy,
    },
    tipBody: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
      lineHeight: 18,
    },
        }),
      [colors],
    );
  const profile = useSessionStore((s) => s.profile);
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const {
    data: services,
    isLoading: servicesLoading,
    isError: servicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ["services"],
    queryFn: () => fetchServices(),
  });
  const {
    data: activeBooking,
    isLoading: activeLoading,
    isError: activeError,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ["activeBooking", userId],
    queryFn: () => fetchActiveBooking(userId as string),
    enabled: Boolean(userId),
  });
  const {
    data: bookAgain,
    isLoading: bookAgainLoading,
    isError: bookAgainError,
  } = useQuery({
    queryKey: ["bookAgain", userId],
    queryFn: () => fetchBookAgain(userId as string),
    enabled: Boolean(userId),
  });

  const isLoading = servicesLoading || activeLoading || bookAgainLoading;
  const isError = servicesError || activeError || bookAgainError;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  if (isError) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ErrorState
          onRetry={() => {
            void refetchServices();
            void refetchActive();
          }}
        />
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Skeleton height={26} width={180} borderRadius={8} />
        <Skeleton height={140} borderRadius={22} />
        <View style={styles.skeletonGrid}>
          <Skeleton height={90} borderRadius={20} />
          <Skeleton height={90} borderRadius={20} delay={150} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
          <Pressable style={styles.locationRow}>
            <MapPin size={13} color={colors.primary} strokeWidth={2} />
            <Text style={styles.locationText}>Jubilee Hills, Hyderabad</Text>
          </Pressable>
        </View>
        <View style={styles.headerButtons}>
          <Pressable style={styles.sosButton} onPress={() => router.push("/sos")}>
            <Siren size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.sosButtonText}>SOS</Text>
          </Pressable>
          <Pressable style={styles.bellButton} onPress={() => router.push("/notifications")}>
            <Bell size={20} color={colors.navy} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.assistantBanner} onPress={() => router.push("/cura-assistant")}>
        <View style={styles.assistantIcon}>
          <MessageCircleHeart size={20} color="#00E392" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.assistantTitle}>Ask Cura, your care assistant</Text>
          <Text style={styles.assistantSubtitle}>Book, track, refill — just tell it what you need</Text>
        </View>
      </Pressable>

      {activeBooking ? (
        <Pressable style={styles.activeCard} onPress={() => router.push(`/bookings/${activeBooking.id}`)}>
          <View style={styles.activeBadgeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.activeBadgeText}>LIVE VISIT</Text>
          </View>
          <Text style={styles.activeService}>Your visit is on the way</Text>
          <View style={styles.trackPill}>
            <Text style={styles.trackPillText}>Track →</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <View style={styles.heroPulseDot} />
            <Text style={styles.heroBadgeText}>RAPID HOME CARE</Text>
          </View>
          <Text style={styles.heroHeadline}>A nurse at your door{"\n"}within the hour.</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Clock size={15} color="#FFFFFF" />
              <Text style={styles.heroMetaText}>~55 min ETA</Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Check size={15} color="#FFFFFF" />
              <Text style={styles.heroMetaText}>No slot picking</Text>
            </View>
          </View>
          <Pressable style={styles.heroCta} onPress={() => router.push("/(tabs)/services")}>
            <Zap size={16} color={colors.primaryPress} />
            <Text style={styles.heroCtaText}>Book instantly — arrives ASAP</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={[type.h3, { color: colors.ink }]}>Book a visit</Text>
        <Pressable onPress={() => router.push("/(tabs)/services")}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.serviceGrid}>
        {(services ?? []).slice(0, 6).map((service) => {
          const accent = categoryAccent(service.category);
          return (
            <Pressable
              key={service.id}
              style={styles.serviceTile}
              onPress={() => router.push({ pathname: "/booking/new", params: { serviceId: service.id } })}
            >
              <View style={[styles.serviceIconChip, { backgroundColor: accent.bg }]}>
                <Sparkles size={20} color={accent.fg} strokeWidth={1.8} />
              </View>
              <Text style={styles.serviceTitle}>{service.name}</Text>
              {service.description ? <Text style={styles.serviceSubtitle}>{service.description}</Text> : null}
              <Text style={styles.servicePrice}>from ₹{service.price_from}</Text>
            </Pressable>
          );
        })}
      </View>

      {bookAgain && bookAgain.length > 0 ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={[type.h3, { color: colors.ink }]}>Book again</Text>
          </View>
          <View style={{ gap: 10 }}>
            {bookAgain.map((card) => (
              <Card key={card.booking.id} style={styles.providerCard}>
                <View style={styles.providerAvatar}>
                  <Text style={styles.providerInitials}>
                    {card.providerName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.providerName}>{card.providerName}</Text>
                  <Text style={styles.providerMeta}>{card.serviceName}</Text>
                </View>
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingText}>★ {card.providerRating.toFixed(1)}</Text>
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <Text style={[type.h3, { color: colors.ink }]}>Your health, organized</Text>
      </View>
      <View style={styles.serviceGrid}>
        {healthTiles.map((tile) => (
          <Pressable key={tile.key} style={styles.healthTile} onPress={() => router.push(tile.route)}>
            <View style={[styles.healthIconChip, { backgroundColor: tile.bg }]}>
              <HeartHandshake size={18} color={tile.fg} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.healthLabel}>{tile.label}</Text>
              <Text style={styles.healthDescription}>{tile.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.push("/health-articles/monsoon-joint-care")}>
      <Card style={styles.tipCard}>
        <View style={styles.tipIconChip}>
          <Sparkles size={19} color={colors.navy} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Monsoon tip for Amma & Appa</Text>
          <Text style={styles.tipBody}>
            Humidity can worsen joint stiffness. A 10-minute morning stretch helps — or book a physio home session.
          </Text>
        </View>
      </Card>
      </Pressable>
    </ScrollView>
  );
}
