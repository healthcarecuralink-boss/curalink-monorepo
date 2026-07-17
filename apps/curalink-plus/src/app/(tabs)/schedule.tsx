import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarOff, Minus, Plus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  cancelTimeOff,
  fetchMyTimeOff,
  fetchProfessionalProfile,
  requestTimeOff,
  updateProfessionalProfile,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, StatusPill, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";

interface Availability {
  days: boolean[];
  areas: string[];
  max_distance_km: number;
}

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
const areas = ["Jubilee Hills", "Banjara Hills", "Kondapur", "Madhapur", "Gachibowli", "Secunderabad"];

const statusColors: Record<string, { fg: string; bg: string }> = {
  requested: { fg: "#B45309", bg: "#FEF3E2" },
  approved: { fg: "#0B5A45", bg: "#E8F5F0" },
  rejected: { fg: "#DC3545", bg: "#FCE8E8" },
};

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
        sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
        fieldLabel: { fontSize: 12, fontWeight: "700", color: colors.muted },
        dayRow: { flexDirection: "row", gap: 8 },
        dayButton: {
          width: 36,
          height: 36,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        dayButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
        dayText: { fontSize: 13, fontWeight: "700", color: colors.muted },
        dayTextSelected: { color: "#FFFFFF" },
        areaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        areaChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        areaChipSelected: { backgroundColor: "#E8F5F0", borderColor: colors.primary },
        areaText: { fontSize: 12.5, fontWeight: "600", color: colors.muted },
        areaTextSelected: { color: colors.primaryPress },
        distanceRow: { flexDirection: "row", alignItems: "center", gap: 16 },
        distanceButton: {
          width: 30,
          height: 30,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        distanceValue: { fontSize: 14, fontWeight: "700", color: colors.ink },
        dateRow: { flexDirection: "row", gap: 8 },
        dateField: { flex: 1 },
        timeOffRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        timeOffDates: { fontSize: 13, fontWeight: "700", color: colors.ink },
        timeOffReason: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const { data: professionalProfile } = useQuery({
    queryKey: ["professionalProfile", userId],
    queryFn: () => fetchProfessionalProfile(userId as string),
    enabled: Boolean(userId),
  });
  const { data: timeOff } = useQuery({
    queryKey: ["myTimeOff", userId],
    queryFn: () => fetchMyTimeOff(userId as string),
    enabled: Boolean(userId),
  });

  const [days, setDays] = useState<boolean[]>([true, true, true, true, true, true, false]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(12);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [loadedProfileId, setLoadedProfileId] = useState<string | null>(null);

  if (professionalProfile && professionalProfile.profile_id !== loadedProfileId) {
    setLoadedProfileId(professionalProfile.profile_id);
    const availability = professionalProfile.availability as unknown as Availability | null;
    if (availability) {
      setDays(availability.days ?? [true, true, true, true, true, true, false]);
      setSelectedAreas(availability.areas ?? []);
      setMaxDistance(availability.max_distance_km ?? 12);
    }
  }

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  function toggleDay(index: number) {
    setDays((prev) => prev.map((d, i) => (i === index ? !d : d)));
  }
  function toggleArea(area: string) {
    setSelectedAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  async function handleSaveAvailability() {
    if (!userId) return;
    setIsSavingAvailability(true);
    try {
      await updateProfessionalProfile(userId, {
        availability: { days, areas: selectedAreas, max_distance_km: maxDistance } as never,
        service_area: selectedAreas[0] ?? null,
      });
      void queryClient.invalidateQueries({ queryKey: ["professionalProfile", userId] });
    } finally {
      setIsSavingAvailability(false);
    }
  }

  async function handleRequestTimeOff() {
    if (!userId || !startDate.trim() || !endDate.trim()) return;
    setIsRequesting(true);
    try {
      await requestTimeOff({ professional_id: userId, start_date: startDate.trim(), end_date: endDate.trim(), reason: reason || null });
      setStartDate("");
      setEndDate("");
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["myTimeOff", userId] });
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleCancel(id: string) {
    await cancelTimeOff(id);
    void queryClient.invalidateQueries({ queryKey: ["myTimeOff", userId] });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Schedule</Text>

      <Text style={styles.sectionTitle}>Weekly availability</Text>
      <Card style={{ gap: 14 }}>
        <Text style={styles.fieldLabel}>Days available</Text>
        <View style={styles.dayRow}>
          {dayLabels.map((label, index) => (
            <Pressable
              key={index}
              style={[styles.dayButton, days[index] && styles.dayButtonSelected]}
              onPress={() => toggleDay(index)}
            >
              <Text style={[styles.dayText, days[index] && styles.dayTextSelected]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Service areas</Text>
        <View style={styles.areaRow}>
          {areas.map((area) => (
            <Pressable
              key={area}
              style={[styles.areaChip, selectedAreas.includes(area) && styles.areaChipSelected]}
              onPress={() => toggleArea(area)}
            >
              <Text style={[styles.areaText, selectedAreas.includes(area) && styles.areaTextSelected]}>{area}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Max travel distance</Text>
        <View style={styles.distanceRow}>
          <Pressable style={styles.distanceButton} onPress={() => setMaxDistance((d) => Math.max(2, d - 1))}>
            <Minus size={16} color={colors.ink} />
          </Pressable>
          <Text style={styles.distanceValue}>Within {maxDistance} km</Text>
          <Pressable style={styles.distanceButton} onPress={() => setMaxDistance((d) => Math.min(30, d + 1))}>
            <Plus size={16} color={colors.ink} />
          </Pressable>
        </View>

        <Button label={isSavingAvailability ? "Saving..." : "Save availability"} disabled={isSavingAvailability} onPress={() => void handleSaveAvailability()} />
      </Card>

      <Text style={styles.sectionTitle}>Request time off</Text>
      <Card style={{ gap: 10 }}>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <TextField label="Start date" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
          </View>
          <View style={styles.dateField}>
            <TextField label="End date" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
          </View>
        </View>
        <TextField label="Reason (optional)" value={reason} onChangeText={setReason} />
        <Button
          label={isRequesting ? "Sending..." : "Request time off"}
          disabled={isRequesting || !startDate.trim() || !endDate.trim()}
          onPress={() => void handleRequestTimeOff()}
        />
      </Card>

      <Text style={styles.sectionTitle}>Your requests</Text>
      {timeOff === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : timeOff.length === 0 ? (
        <EmptyState icon={<CalendarOff size={26} color={colors.primary} strokeWidth={1.6} />} title="No time-off requests yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {timeOff.map((request) => (
            <Card key={request.id} style={styles.timeOffRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeOffDates}>
                  {request.start_date} – {request.end_date}
                </Text>
                {request.reason ? <Text style={styles.timeOffReason}>{request.reason}</Text> : null}
              </View>
              <StatusPill label={request.status} {...(statusColors[request.status] ?? { fg: colors.muted, bg: colors.border })} />
              {request.status === "requested" ? (
                <Button label="Cancel" variant="secondary" onPress={() => void handleCancel(request.id)} />
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
