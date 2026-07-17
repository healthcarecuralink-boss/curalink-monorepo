import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon, Pill, Siren } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import {
  fetchActiveAmbulanceJob,
  fetchActivePharmacyOrderLocations,
  fetchAmbulanceRequestDetail,
  fetchProviderLocation,
  subscribeToProviderLocation,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, LeafletMap, Skeleton, curalinkPlusFonts, useTheme, type LeafletMarker } from "@curalink/ui";

// README: Pharmacy Partner "Pickup map", Ambulance Partner "Live map" -- one
// shared tab route, rendered differently per active role. Pharmacy orders
// have no GPS stream (never modeled in this schema), so their map shows
// static delivery-address pins; the ambulance side is a real live-tracked
// map, matching the same pattern as jobs/[id].tsx and dispatch.tsx.
export default function MapScreen() {
  const activeRole = useSessionStore((s) => s.activeRole);

  if (activeRole === "pharmacy") return <PharmacyPickupMap />;
  if (activeRole === "ambulance") return <AmbulanceLiveMap />;
  return <EmptyMap />;
}

function useMapStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: { paddingTop: 60, paddingHorizontal: 20 },
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
        subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
        body: { padding: 20, gap: 14, flex: 1 },
      }),
    [colors],
  );
}

function EmptyMap() {
  const { colors } = useTheme();
  const styles = useMapStyles();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
      </View>
      <View style={styles.body}>
        <EmptyState icon={<MapIcon size={26} color={colors.primary} strokeWidth={1.6} />} title="No map for this role" />
      </View>
    </View>
  );
}

function PharmacyPickupMap() {
  const { colors } = useTheme();
  const styles = useMapStyles();
  const session = useSessionStore((s) => s.session);
  const pharmacyId = session?.user.id;

  const { data: locations } = useQuery({
    queryKey: ["activePharmacyOrderLocations", pharmacyId],
    queryFn: () => fetchActivePharmacyOrderLocations(pharmacyId as string),
    enabled: Boolean(pharmacyId),
    refetchInterval: 30_000,
  });

  const markers: LeafletMarker[] = (locations ?? []).map((loc) => ({
    id: loc.orderId,
    lat: loc.lat,
    lng: loc.lng,
    color: "#0EA5E9",
    label: "D",
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pickup map</Text>
        <Text style={styles.subtitle}>{markers.length} active delivery address{markers.length === 1 ? "" : "es"}</Text>
      </View>
      <View style={styles.body}>
        {locations === undefined ? (
          <Skeleton height={300} borderRadius={16} />
        ) : markers.length === 0 ? (
          <EmptyState icon={<Pill size={26} color={colors.primary} strokeWidth={1.6} />} title="No active orders to deliver right now" />
        ) : (
          <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
            <LeafletMap markers={markers} fitToMarkers={markers.length > 1} zoom={12} style={{ flex: 1 }} />
          </Card>
        )}
      </View>
    </View>
  );
}

function AmbulanceLiveMap() {
  const { colors } = useTheme();
  const styles = useMapStyles();
  const session = useSessionStore((s) => s.session);
  const partnerId = session?.user.id;
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: activeJob } = useQuery({
    queryKey: ["activeAmbulanceJob", partnerId],
    queryFn: () => fetchActiveAmbulanceJob(partnerId as string),
    enabled: Boolean(partnerId),
    refetchInterval: 15_000,
  });

  const { data: detail } = useQuery({
    queryKey: ["ambulanceRequestDetail", activeJob?.id],
    queryFn: () => fetchAmbulanceRequestDetail(activeJob?.id as string),
    enabled: Boolean(activeJob?.id),
  });

  const isTracking = activeJob?.status === "en_route" || activeJob?.status === "transporting";

  useEffect(() => {
    if (!isTracking || !activeJob?.id) return;
    void fetchProviderLocation("ambulance_request", activeJob.id).then((loc) => {
      if (loc) setMyLocation({ lat: loc.lat, lng: loc.lng });
    });
    const channel = subscribeToProviderLocation("ambulance_request", activeJob.id, (loc) => setMyLocation({ lat: loc.lat, lng: loc.lng }));
    return () => {
      void channel.unsubscribe();
    };
  }, [isTracking, activeJob?.id]);

  const markers: LeafletMarker[] = [];
  if (isTracking && myLocation) {
    markers.push({ id: "me", lat: myLocation.lat, lng: myLocation.lng, color: "#DC3545", label: "Me", pulse: true });
  }
  if (detail && detail.addressLat !== null && detail.addressLng !== null) {
    markers.push({ id: "pickup", lat: detail.addressLat, lng: detail.addressLng, color: "#0F7A5E", label: "Pickup" });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live map</Text>
        <Text style={styles.subtitle}>{activeJob ? `Tracking your active ${activeJob.type} trip` : "No active trip"}</Text>
      </View>
      <View style={styles.body}>
        {activeJob === undefined ? (
          <Skeleton height={300} borderRadius={16} />
        ) : !activeJob ? (
          <EmptyState
            icon={<Siren size={26} color={colors.error} strokeWidth={1.6} />}
            title="No active trip right now"
            body="Accept a request to see it tracked here."
          />
        ) : markers.length === 0 ? (
          <EmptyState icon={<MapIcon size={26} color={colors.primary} strokeWidth={1.6} />} title="Waiting for location data..." />
        ) : (
          <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
            <LeafletMap markers={markers} fitToMarkers={markers.length > 1} zoom={14} style={{ flex: 1 }} />
          </Card>
        )}
      </View>
    </View>
  );
}
