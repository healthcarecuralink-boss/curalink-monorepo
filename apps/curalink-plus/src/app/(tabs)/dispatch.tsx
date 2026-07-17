import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import {
  fetchMyTeam,
  fetchProviderLocationsForJobs,
  fetchTeamActiveAmbulanceRequests,
  fetchTeamActiveBookings,
  fetchTeamRosterWithProfiles,
  subscribeToProviderLocation,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, LeafletMap, Skeleton, curalinkPlusFonts, useTheme, type LeafletMarker } from "@curalink/ui";

interface LiveLocation {
  jobType: "booking" | "ambulance_request";
  jobId: string;
  lat: number;
  lng: number;
}

// README: "Live dispatch map (nurse jobs = green, pharmacy = blue, ambulance
// = red)". Pharmacy orders have no GPS stream in this schema (never
// modeled), so only nurse/vet/doctor bookings and ambulance trips plot here
// -- an honest scope limit, not a bug.
export default function DispatchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
        subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
        legendRow: { flexDirection: "row", gap: 16, alignItems: "center" },
        legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
        legendDot: { width: 10, height: 10, borderRadius: 5 },
        legendText: { fontSize: 11.5, color: colors.muted },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const adminId = session?.user.id;

  const { data: team } = useQuery({
    queryKey: ["myTeam", adminId],
    queryFn: () => fetchMyTeam(adminId as string),
    enabled: Boolean(adminId),
  });
  const { data: roster } = useQuery({
    queryKey: ["teamRosterWithProfiles", team?.id],
    queryFn: () => fetchTeamRosterWithProfiles(team?.id as string),
    enabled: Boolean(team?.id),
  });

  const bookingRoleIds = (roster ?? [])
    .filter((r) => r.member.role === "nurse" || r.member.role === "vet" || r.member.role === "doctor")
    .map((r) => r.member.professional_id);
  const ambulanceIds = (roster ?? []).filter((r) => r.member.role === "ambulance").map((r) => r.member.professional_id);

  const { data: activeBookings } = useQuery({
    queryKey: ["teamActiveBookings", team?.id],
    queryFn: () => fetchTeamActiveBookings(bookingRoleIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });
  const { data: activeAmbulanceRequests } = useQuery({
    queryKey: ["teamActiveAmbulanceRequests", team?.id],
    queryFn: () => fetchTeamActiveAmbulanceRequests(ambulanceIds),
    enabled: Boolean(team?.id) && roster !== undefined,
  });

  const enRouteBookingIds = (activeBookings ?? [])
    .filter((b) => b.status === "en_route" || b.status === "in_progress")
    .map((b) => b.id);
  const trackedAmbulanceIds = (activeAmbulanceRequests ?? [])
    .filter((a) => a.status === "en_route" || a.status === "transporting")
    .map((a) => a.id);

  const { data: bookingLocations } = useQuery({
    queryKey: ["teamBookingLocations", enRouteBookingIds.join(",")],
    queryFn: () => fetchProviderLocationsForJobs("booking", enRouteBookingIds),
    enabled: enRouteBookingIds.length > 0,
  });
  const { data: ambulanceLocations } = useQuery({
    queryKey: ["teamAmbulanceLocations", trackedAmbulanceIds.join(",")],
    queryFn: () => fetchProviderLocationsForJobs("ambulance_request", trackedAmbulanceIds),
    enabled: trackedAmbulanceIds.length > 0,
  });

  // Base positions come straight from the query results (no effect/state
  // needed just to mirror query data); realtime updates layer on top in
  // their own state, keyed the same way so a fresher realtime value always
  // wins over the initial fetch.
  const queriedLocations = useMemo(() => {
    const base: Record<string, LiveLocation> = {};
    (bookingLocations ?? []).forEach((loc) => {
      base[`booking:${loc.job_id}`] = { jobType: "booking", jobId: loc.job_id, lat: loc.lat, lng: loc.lng };
    });
    (ambulanceLocations ?? []).forEach((loc) => {
      base[`ambulance_request:${loc.job_id}`] = { jobType: "ambulance_request", jobId: loc.job_id, lat: loc.lat, lng: loc.lng };
    });
    return base;
  }, [bookingLocations, ambulanceLocations]);

  const [realtimeLocations, setRealtimeLocations] = useState<Record<string, LiveLocation>>({});
  const liveLocations = { ...queriedLocations, ...realtimeLocations };

  useEffect(() => {
    const channels = [
      ...enRouteBookingIds.map((jobId) =>
        subscribeToProviderLocation("booking", jobId, (loc) =>
          setRealtimeLocations((prev) => ({ ...prev, [`booking:${jobId}`]: { jobType: "booking", jobId, lat: loc.lat, lng: loc.lng } })),
        ),
      ),
      ...trackedAmbulanceIds.map((jobId) =>
        subscribeToProviderLocation("ambulance_request", jobId, (loc) =>
          setRealtimeLocations((prev) => ({
            ...prev,
            [`ambulance_request:${jobId}`]: { jobType: "ambulance_request", jobId, lat: loc.lat, lng: loc.lng },
          })),
        ),
      ),
    ];
    return () => {
      channels.forEach((c) => void c.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enRouteBookingIds.join(","), trackedAmbulanceIds.join(",")]);

  const markers: LeafletMarker[] = Object.values(liveLocations).map((loc) => ({
    id: `${loc.jobType}:${loc.jobId}`,
    lat: loc.lat,
    lng: loc.lng,
    color: loc.jobType === "ambulance_request" ? "#DC3545" : "#0F7A5E",
    label: loc.jobType === "ambulance_request" ? "A" : "N",
    pulse: true,
  }));

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20 }}>
        <Text style={styles.title}>Live dispatch</Text>
        <Text style={styles.subtitle}>{markers.length} job{markers.length === 1 ? "" : "s"} currently tracked live</Text>
      </View>
      <View style={{ padding: 20, gap: 14, flex: 1 }}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#0F7A5E" }]} />
            <Text style={styles.legendText}>Nurse/vet/doctor</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#DC3545" }]} />
            <Text style={styles.legendText}>Ambulance</Text>
          </View>
        </View>

        {roster === undefined || activeBookings === undefined || activeAmbulanceRequests === undefined ? (
          <Skeleton height={300} borderRadius={16} />
        ) : markers.length === 0 ? (
          <EmptyState icon={<MapIcon size={26} color={colors.primary} strokeWidth={1.6} />} title="No jobs currently en route" />
        ) : (
          <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
            <LeafletMap markers={markers} fitToMarkers={markers.length > 1} zoom={12} style={{ flex: 1 }} />
          </Card>
        )}
      </View>
    </View>
  );
}
