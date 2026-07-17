import { useEffect, useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Siren } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  advanceAmbulanceStatus,
  claimAmbulanceRequest,
  fetchAmbulanceRequestDetail,
  fetchProviderLocation,
  subscribeToProviderLocation,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, LeafletMap, Skeleton, StatusPill, curalinkPlusFonts, useTheme, type ThemeContextValue, type LeafletMarker } from "@curalink/ui";
import { useLocationPublisher } from "../../utils/useLocationPublisher";

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

const statusColors: Record<string, { fg: string; bg: string }> = {
  requested: { fg: "#B45309", bg: "#FEF3E2" },
  accepted: { fg: "#1D4ED8", bg: "#EAF1FE" },
  en_route: { fg: "#1D4ED8", bg: "#EAF1FE" },
  arrived: { fg: "#1D4ED8", bg: "#EAF1FE" },
  transporting: { fg: "#0B5A45", bg: "#E8F5F0" },
  completed: { fg: "#0B5A45", bg: "#E8F5F0" },
  cancelled: { fg: "#64748B", bg: "#EEF1F4" },
};

const nextStep: Record<string, { status: "en_route" | "arrived" | "transporting" | "completed"; label: string } | undefined> = {
  accepted: { status: "en_route", label: "Start heading to patient" },
  en_route: { status: "arrived", label: "I've arrived" },
  arrived: { status: "transporting", label: "Start transporting" },
  transporting: { status: "completed", label: "Mark trip completed" },
};

export default function AmbulanceRequestDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 14 },
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
    title: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink, textTransform: "capitalize" },
    subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
        }),
      [colors],
    );

  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: detail } = useQuery({
    queryKey: ["ambulanceRequestDetail", id],
    queryFn: () => fetchAmbulanceRequestDetail(id),
    enabled: Boolean(id),
  });

  const isTracking = detail?.request.status === "en_route" || detail?.request.status === "transporting";
  useLocationPublisher("ambulance_request", id, userId, isTracking);

  useEffect(() => {
    if (!isTracking) return;
    void fetchProviderLocation("ambulance_request", id).then((loc) => {
      if (loc) setMyLocation({ lat: loc.lat, lng: loc.lng });
    });
    const channel = subscribeToProviderLocation("ambulance_request", id, (loc) => setMyLocation({ lat: loc.lat, lng: loc.lng }));
    return () => {
      void channel.unsubscribe();
    };
  }, [isTracking, id]);

  async function handleClaim() {
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await claimAmbulanceRequest(id, userId);
      void queryClient.invalidateQueries({ queryKey: ["ambulanceRequestDetail", id] });
      void queryClient.invalidateQueries({ queryKey: ["incomingAmbulanceRequests"] });
      void queryClient.invalidateQueries({ queryKey: ["activeAmbulanceJob"] });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdvance(status: "en_route" | "arrived" | "transporting" | "completed") {
    setIsSubmitting(true);
    try {
      await advanceAmbulanceStatus(id, status);
      void queryClient.invalidateQueries({ queryKey: ["ambulanceRequestDetail", id] });
      void queryClient.invalidateQueries({ queryKey: ["ambulanceRequestHistory"] });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={13} />
      </View>
    );
  }

  const { request, addressLine, addressLat, addressLng } = detail;
  const step = nextStep[request.status];
  const mapMarkers: LeafletMarker[] = [];
  if (isTracking && myLocation) {
    mapMarkers.push({ id: "me", lat: myLocation.lat, lng: myLocation.lng, color: "#DC3545", label: "Me", pulse: true });
  }
  if (addressLat !== null && addressLng !== null) {
    mapMarkers.push({ id: "pickup", lat: addressLat, lng: addressLng, color: "#0F7A5E", label: "Pickup" });
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
            {request.type} · {request.patient_init ?? "Patient"}
          </Text>
          {request.reason ? <Text style={styles.subtitle}>{request.reason}</Text> : null}
        </View>
        <StatusPill
          label={request.status.replace("_", " ")}
          {...(statusColors[request.status] ?? { fg: colors.muted, bg: colors.border })}
        />
      </View>

      {mapMarkers.length > 0 ? (
        <LeafletMap markers={mapMarkers} fitToMarkers={mapMarkers.length > 1} zoom={14} style={{ height: 160 }} />
      ) : null}

      <Card>
        <Row label="Pickup address" value={addressLine ?? "Not provided"} colors={colors} />
        <Row label="Hospital" value={request.hospital ?? "Not specified"} colors={colors} />
        <Row label="Requested" value={new Date(request.created_at).toLocaleString("en-IN")} colors={colors} />
      </Card>

      {request.status === "requested" ? (
        <Button
          label={isSubmitting ? "Accepting..." : "Accept request"}
          icon={<Siren size={16} color="#FFFFFF" />}
          disabled={isSubmitting}
          onPress={() => void handleClaim()}
        />
      ) : null}

      {step ? (
        <Button
          label={isSubmitting ? "Updating..." : step.label}
          disabled={isSubmitting}
          onPress={() => void handleAdvance(step.status)}
        />
      ) : null}
    </ScrollView>
  );
}
