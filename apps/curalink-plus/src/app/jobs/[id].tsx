import { useEffect, useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Navigation } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  acceptJob,
  fetchJobDetail,
  fetchOrCreateCareTeamChannel,
  fetchProviderLocation,
  subscribeToProviderLocation,
  updateBookingStatus,
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
  pending: { fg: "#B45309", bg: "#FEF3E2" },
  confirmed: { fg: "#1D4ED8", bg: "#EAF1FE" },
  en_route: { fg: "#1D4ED8", bg: "#EAF1FE" },
  in_progress: { fg: "#0B5A45", bg: "#E8F5F0" },
  completed: { fg: "#0B5A45", bg: "#E8F5F0" },
  cancelled: { fg: "#64748B", bg: "#EEF1F4" },
};

export default function JobDetailScreen() {
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
    title: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 16, color: colors.ink },
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
    queryKey: ["jobDetail", id],
    queryFn: () => fetchJobDetail(id),
    enabled: Boolean(id),
  });

  const isEnRoute = detail?.booking.status === "en_route";
  useLocationPublisher("booking", id, userId, isEnRoute);

  useEffect(() => {
    if (!isEnRoute) return;
    void fetchProviderLocation("booking", id).then((loc) => {
      if (loc) setMyLocation({ lat: loc.lat, lng: loc.lng });
    });
    const channel = subscribeToProviderLocation("booking", id, (loc) => setMyLocation({ lat: loc.lat, lng: loc.lng }));
    return () => {
      void channel.unsubscribe();
    };
  }, [isEnRoute, id]);

  async function handleMessageCareTeam() {
    const userId = session?.user.id;
    if (!userId) return;
    const channel = await fetchOrCreateCareTeamChannel(id, userId);
    router.push(`/chat/${channel.id}`);
  }

  async function handleAccept() {
    const userId = session?.user.id;
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await acceptJob(id, userId);
      void queryClient.invalidateQueries({ queryKey: ["jobDetail", id] });
      void queryClient.invalidateQueries({ queryKey: ["availableJobs"] });
      void queryClient.invalidateQueries({ queryKey: ["activeJob"] });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdvance(nextStatus: "en_route" | "in_progress") {
    setIsSubmitting(true);
    try {
      await updateBookingStatus(id, nextStatus);
      if (nextStatus === "in_progress") {
        router.replace(`/visit/${id}`);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["jobDetail", id] });
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

  const { booking, serviceName, patientName, addressLine, addressLat, addressLng } = detail;
  const mapMarkers: LeafletMarker[] = [];
  if (isEnRoute && myLocation) {
    mapMarkers.push({ id: "me", lat: myLocation.lat, lng: myLocation.lng, color: "#0F7A5E", label: "Me", pulse: true });
  }
  if (addressLat !== null && addressLng !== null) {
    mapMarkers.push({ id: "destination", lat: addressLat, lng: addressLng, color: "#DC3545", label: "Patient" });
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
          <Text style={styles.title}>{serviceName}</Text>
          {patientName ? <Text style={styles.subtitle}>for {patientName}</Text> : null}
        </View>
        <StatusPill
          label={booking.status.replace("_", " ")}
          {...(statusColors[booking.status] ?? { fg: colors.muted, bg: colors.border })}
        />
      </View>

      {mapMarkers.length > 0 ? (
        <LeafletMap markers={mapMarkers} fitToMarkers={mapMarkers.length > 1} zoom={14} style={{ height: 160 }} />
      ) : null}

      <Card>
        <Row label="Address" value={addressLine ?? "Not provided"} colors={colors} />
        <Row label="Price" value={`₹${booking.price}`} colors={colors} />
        <Row label="Scheduled" value={new Date(booking.scheduled_at).toLocaleString("en-IN")} colors={colors} />
      </Card>

      {booking.status === "pending" ? (
        <Button label={isSubmitting ? "Accepting..." : "Accept job"} disabled={isSubmitting} onPress={() => void handleAccept()} />
      ) : null}
      {booking.status === "confirmed" ? (
        <Button
          label={isSubmitting ? "Updating..." : "Start heading to patient"}
          icon={<Navigation size={16} color="#FFFFFF" />}
          disabled={isSubmitting}
          onPress={() => void handleAdvance("en_route")}
        />
      ) : null}
      {booking.status === "en_route" ? (
        <Button
          label={isSubmitting ? "Updating..." : "I've arrived — start visit"}
          disabled={isSubmitting}
          onPress={() => void handleAdvance("in_progress")}
        />
      ) : null}
      {booking.status === "in_progress" ? (
        <Button label="Continue visit" onPress={() => router.push(`/visit/${id}`)} />
      ) : null}

      {booking.status !== "pending" ? (
        <Button
          label="Message care team"
          variant="secondary"
          icon={<MessageCircle size={16} color={colors.ink} />}
          onPress={() => void handleMessageCareTeam()}
        />
      ) : null}
    </ScrollView>
  );
}
