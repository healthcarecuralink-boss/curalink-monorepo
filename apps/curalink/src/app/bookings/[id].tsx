import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, IndianRupee, MessageCircle, Navigation, Star } from "lucide-react-native";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchBookingDetail,
  fetchProviderLocation,
  fetchWalletBalance,
  payTipFromWallet,
  rateBooking,
  subscribeToProviderLocation,
  toWhatsAppLink,
  useSessionStore,
} from "@curalink/api-client";
import {
  Button,
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

const tipPresets = [20, 50, 100];

const statusPillFor = (status: string) => {
  switch (status) {
    case "pending":
      return curalinkStatusPillColors.pending;
    case "confirmed":
      return curalinkStatusPillColors.confirmed;
    case "en_route":
      return curalinkStatusPillColors.enRoute;
    case "in_progress":
      return curalinkStatusPillColors.inProgress;
    case "completed":
      return curalinkStatusPillColors.completed;
    default:
      return curalinkStatusPillColors.cancelled;
  }
};

function Row({ label, value, colors }: { label: string; value: string; colors: ThemeContextValue["colors"] }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ fontSize: 12, color: colors.muted, textTransform: "capitalize" }}>{label}</Text>
      <Text style={{ fontSize: 12.5, color: colors.ink, fontWeight: "600", textTransform: "capitalize" }}>{value}</Text>
    </View>
  );
}

export default function BookingDetailScreen() {
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
    subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: colors.ink, marginBottom: 8, textTransform: "capitalize" },
    bodyText: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
    ratingCard: { gap: 8 },
    tipRow: { flexDirection: "row", gap: 8 },
    tipChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    tipChipSelected: { backgroundColor: colors.successTint, borderColor: colors.primary },
    tipChipText: { fontSize: 13, fontWeight: "700", color: colors.ink },
    tipBalance: { fontSize: 11, color: colors.muted2, textAlign: "center" },
    waitingRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
    waitingText: { fontSize: 12.5, color: colors.muted2, flexShrink: 1 },
        }),
      [colors],
    );

  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [isTipping, setIsTipping] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ["bookingDetail", id],
    queryFn: () => fetchBookingDetail(id),
    enabled: Boolean(id),
  });
  const { data: walletBalance } = useQuery({
    queryKey: ["walletBalance", profileId],
    queryFn: () => fetchWalletBalance(profileId as string),
    enabled: Boolean(profileId),
  });

  const isEnRoute = detail?.booking.status === "en_route";
  const [providerLocation, setProviderLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!isEnRoute || !id) return;
    void fetchProviderLocation("booking", id).then((loc) => {
      if (loc) setProviderLocation({ lat: loc.lat, lng: loc.lng });
    });
    const channel = subscribeToProviderLocation("booking", id, (loc) => setProviderLocation({ lat: loc.lat, lng: loc.lng }));
    return () => {
      void channel.unsubscribe();
    };
  }, [isEnRoute, id]);

  function handleTalkOnWhatsApp(providerPhone: string, providerName: string | null) {
    void Linking.openURL(
      toWhatsAppLink(providerPhone, `Hi ${providerName ?? "Doctor"}, I'm ready for my CuraLink consultation.`),
    );
  }

  async function handleRate(rating: number, review: string) {
    await rateBooking(id, rating, review);
    void queryClient.invalidateQueries({ queryKey: ["bookingDetail", id] });
  }

  async function handleTip() {
    if (!selectedTip) return;
    setIsTipping(true);
    try {
      await payTipFromWallet(id, selectedTip);
      setSelectedTip(null);
      void queryClient.invalidateQueries({ queryKey: ["bookingDetail", id] });
      void queryClient.invalidateQueries({ queryKey: ["walletBalance", profileId] });
    } finally {
      setIsTipping(false);
    }
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={18} />
      </View>
    );
  }

  const { booking, serviceName, serviceCategory, patientName, providerName, providerPhone, addressLat, addressLng } = detail;
  const canTalkOnWhatsApp =
    serviceCategory === "doctor" &&
    (booking.status === "confirmed" || booking.status === "in_progress") &&
    Boolean(providerPhone);
  const vitals = booking.vitals as Record<string, string>;
  const medsGiven = Array.isArray(booking.meds_given) ? (booking.meds_given as { name?: string }[]) : [];

  const trackingMarkers: LeafletMarker[] = [];
  let etaMinutes: number | null = null;
  if (isEnRoute && providerLocation) {
    trackingMarkers.push({ id: "provider", lat: providerLocation.lat, lng: providerLocation.lng, color: "#0F7A5E", label: providerName?.[0] ?? "N", pulse: true });
    if (addressLat !== null && addressLng !== null) {
      trackingMarkers.push({ id: "destination", lat: addressLat, lng: addressLng, color: "#DC3545", label: "You" });
      const distanceKm = haversineKm(providerLocation.lat, providerLocation.lng, addressLat, addressLng);
      etaMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
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
          <Text style={styles.title}>{serviceName}</Text>
          {patientName ? <Text style={styles.subtitle}>for {patientName}</Text> : null}
        </View>
        <StatusPill label={booking.status.replace("_", " ")} {...statusPillFor(booking.status)} />
      </View>

      {isEnRoute ? (
        <Card style={{ gap: 10 }}>
          {trackingMarkers.length > 0 ? (
            <LeafletMap markers={trackingMarkers} fitToMarkers={trackingMarkers.length > 1} zoom={14} style={{ height: 180 }} />
          ) : (
            <Text style={styles.bodyText}>Waiting for {providerName ?? "your provider"}&apos;s live location...</Text>
          )}
          {etaMinutes !== null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Navigation size={14} color={colors.primary} />
              <Text style={styles.sectionTitle}>Arriving in ~{etaMinutes} min</Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Row label="Date" value={new Date(booking.scheduled_at).toLocaleString("en-IN")} colors={colors} />
        {booking.professional_id ? (
          <Pressable onPress={() => router.push(`/provider/${booking.professional_id}`)}>
            <Row label="Provider" value={`${providerName ?? "View profile"} →`} colors={colors} />
          </Pressable>
        ) : (
          <Row label="Provider" value="Not yet assigned" colors={colors} />
        )}
        <Row label="Price" value={`₹${booking.price}`} colors={colors} />
        <Row label="Payment" value={booking.payment_status} colors={colors} />
      </Card>

      {booking.status === "pending" ? (
        <View style={styles.waitingRow}>
          <Clock size={16} color={colors.muted2} strokeWidth={1.8} />
          <Text style={styles.waitingText}>
            {booking.escalated_at
              ? "Still finding you a provider — this is taking longer than usual, and our team has been alerted to step in."
              : "We're finding a nearby professional for you now. You'll get a notification the moment someone accepts."}
          </Text>
        </View>
      ) : null}

      {canTalkOnWhatsApp && providerPhone ? (
        <Button
          label="Talk to your doctor on WhatsApp"
          icon={<MessageCircle size={16} color="#FFFFFF" />}
          onPress={() => handleTalkOnWhatsApp(providerPhone, providerName)}
        />
      ) : null}

      {Object.keys(vitals ?? {}).length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Vitals</Text>
          {Object.entries(vitals).map(([key, value]) => (
            <Row key={key} label={key} value={String(value)} colors={colors} />
          ))}
        </Card>
      ) : null}

      {booking.notes ? (
        <Card>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.bodyText}>{booking.notes}</Text>
        </Card>
      ) : null}

      {medsGiven.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Medications given</Text>
          {medsGiven.map((med, i) => (
            <Text key={i} style={styles.bodyText}>
              • {med.name}
            </Text>
          ))}
        </Card>
      ) : null}

      {booking.handoff_note ? (
        <Card>
          <Text style={styles.sectionTitle}>Handoff note to care team</Text>
          <Text style={styles.bodyText}>{booking.handoff_note}</Text>
        </Card>
      ) : null}

      {booking.rating ? (
        <Card style={styles.ratingCard}>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} color={colors.star} fill={i < (booking.rating ?? 0) ? colors.star : "transparent"} />
            ))}
          </View>
          {booking.review ? <Text style={styles.bodyText}>{booking.review}</Text> : null}
        </Card>
      ) : booking.status === "completed" ? (
        <RatingForm onSubmit={handleRate} />
      ) : null}

      {booking.status === "completed" ? (
        <Card style={{ gap: 10 }}>
          <Text style={styles.sectionTitle}>
            {booking.tip_amount > 0 ? `You tipped ₹${booking.tip_amount}` : "Add a tip"}
          </Text>
          {booking.tip_amount === 0 ? (
            <>
              <View style={styles.tipRow}>
                {tipPresets.map((amount) => (
                  <Pressable
                    key={amount}
                    style={[styles.tipChip, selectedTip === amount && styles.tipChipSelected]}
                    onPress={() => setSelectedTip(amount)}
                  >
                    <Text style={styles.tipChipText}>₹{amount}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.tipBalance}>Wallet balance: ₹{walletBalance ?? 0}</Text>
              <Button
                label={isTipping ? "Sending..." : "Send tip from wallet"}
                icon={<IndianRupee size={16} color="#FFFFFF" />}
                disabled={!selectedTip || isTipping || (walletBalance ?? 0) < (selectedTip ?? 0)}
                onPress={() => void handleTip()}
              />
            </>
          ) : null}
        </Card>
      ) : null}

      {booking.cancelled_reason ? (
        <Card>
          <Text style={styles.sectionTitle}>Cancellation reason</Text>
          <Text style={styles.bodyText}>{booking.cancelled_reason}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}
