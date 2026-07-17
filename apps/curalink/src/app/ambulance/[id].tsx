import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Navigation, Siren } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchAmbulanceRequestDetail,
  fetchProviderLocation,
  rateAmbulanceRequest,
  subscribeToProviderLocation,
} from "@curalink/api-client";
import {
  Card,
  LeafletMap,
  Skeleton,
  StatusPill,
  curalinkFonts,
  curalinkStatusPillColors,
  useTheme,
  type LeafletMarker,
  type ThemeContextValue,
} from "@curalink/ui";
import { RatingForm } from "../../components/RatingForm";
import { haversineKm } from "../../utils/geo";

function Row({ label, value, colors }: { label: string; value: string; colors: ThemeContextValue["colors"] }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 12.5, color: colors.ink, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 12 }}>
        {value}
      </Text>
    </View>
  );
}

const statusPillFor = (status: string) => {
  switch (status) {
    case "requested":
      return curalinkStatusPillColors.pending;
    case "accepted":
    case "arrived":
      return curalinkStatusPillColors.confirmed;
    case "en_route":
    case "transporting":
      return curalinkStatusPillColors.enRoute;
    case "completed":
      return curalinkStatusPillColors.completed;
    default:
      return curalinkStatusPillColors.cancelled;
  }
};

const statusSteps = ["requested", "accepted", "en_route", "arrived", "transporting", "completed"];

export default function AmbulanceRequestDetailScreen() {
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
    title: { fontFamily: curalinkFonts.heading, fontSize: 18, color: colors.ink, textTransform: "capitalize" },
    subtitle: { fontSize: 12, color: colors.muted2, marginTop: 1 },
    timeline: { gap: 10 },
    timelineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.border2 },
    timelineLabel: { fontSize: 12.5, color: colors.muted2, textTransform: "capitalize" },
    waitingRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
    waitingText: { fontSize: 12.5, color: colors.muted2, flexShrink: 1 },
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: colors.ink, marginBottom: 8 },
    bodyText: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
        }),
      [colors],
    );

  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: detail } = useQuery({
    queryKey: ["consumerAmbulanceRequestDetail", id],
    queryFn: () => fetchAmbulanceRequestDetail(id),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });

  const isTracking = detail?.request.status === "en_route" || detail?.request.status === "transporting";
  const [providerLocation, setProviderLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!isTracking || !id) return;
    void fetchProviderLocation("ambulance_request", id).then((loc) => {
      if (loc) setProviderLocation({ lat: loc.lat, lng: loc.lng });
    });
    const channel = subscribeToProviderLocation("ambulance_request", id, (loc) => setProviderLocation({ lat: loc.lat, lng: loc.lng }));
    return () => {
      void channel.unsubscribe();
    };
  }, [isTracking, id]);

  async function handleRate(rating: number, review: string) {
    await rateAmbulanceRequest(id, rating, review);
    void queryClient.invalidateQueries({ queryKey: ["consumerAmbulanceRequestDetail", id] });
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={18} />
      </View>
    );
  }

  const { request, addressLine, addressLat, addressLng, partnerName } = detail;
  const currentStepIndex = statusSteps.indexOf(request.status);

  const trackingMarkers: LeafletMarker[] = [];
  let etaMinutes: number | null = null;
  if (isTracking && providerLocation) {
    trackingMarkers.push({ id: "ambulance", lat: providerLocation.lat, lng: providerLocation.lng, color: "#DC3545", label: "A", pulse: true });
    if (addressLat !== null && addressLng !== null) {
      trackingMarkers.push({ id: "pickup", lat: addressLat, lng: addressLng, color: "#0F7A5E", label: "You" });
      const distanceKm = haversineKm(providerLocation.lat, providerLocation.lng, addressLat, addressLng);
      etaMinutes = Math.max(1, Math.round((distanceKm / 30) * 60));
    }
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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {request.type} ambulance
          </Text>
          {partnerName ? <Text style={styles.subtitle}>{partnerName}</Text> : null}
        </View>
        <StatusPill label={request.status.replace("_", " ")} {...statusPillFor(request.status)} />
      </View>

      {isTracking ? (
        <Card style={{ gap: 10 }}>
          {trackingMarkers.length > 0 ? (
            <LeafletMap markers={trackingMarkers} fitToMarkers={trackingMarkers.length > 1} zoom={14} style={{ height: 180 }} />
          ) : (
            <Text style={styles.bodyText}>Waiting for the ambulance&apos;s live location...</Text>
          )}
          {etaMinutes !== null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Navigation size={14} color={colors.error} />
              <Text style={styles.sectionTitle}>Arriving in ~{etaMinutes} min</Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {request.status !== "cancelled" ? (
        <Card style={styles.timeline}>
          {statusSteps.map((step, i) => (
            <View key={step} style={styles.timelineRow}>
              <View style={[styles.timelineDot, i <= currentStepIndex && { backgroundColor: colors.error }]} />
              <Text style={[styles.timelineLabel, i <= currentStepIndex && { color: colors.ink, fontWeight: "700" }]}>
                {step.replace("_", " ")}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <Row label="Pickup" value={addressLine ?? "Not provided"} colors={colors} />
        <Row label="Hospital" value={request.hospital ?? "Not specified"} colors={colors} />
        {request.reason ? <Row label="Reason" value={request.reason} colors={colors} /> : null}
      </Card>

      {request.status === "requested" ? (
        <View style={styles.waitingRow}>
          <Siren size={16} color={colors.error} strokeWidth={1.8} />
          <Text style={styles.waitingText}>
            {request.escalated_at
              ? "Still finding you an ambulance — this is taking longer than expected, and our team has been alerted to step in urgently."
              : "Looking for the nearest available ambulance partner..."}
          </Text>
        </View>
      ) : null}

      {request.rating ? (
        <Card>
          <Text style={styles.sectionTitle}>Your rating</Text>
          <Text style={styles.bodyText}>
            {"★".repeat(request.rating)}
            {request.review ? ` — ${request.review}` : ""}
          </Text>
        </Card>
      ) : request.status === "completed" ? (
        <RatingForm onSubmit={handleRate} />
      ) : null}
    </ScrollView>
  );
}
