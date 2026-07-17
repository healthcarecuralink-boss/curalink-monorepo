import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRightLeft, Briefcase } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchEscalatedAmbulanceRequests,
  fetchEscalatedBookings,
  fetchMyTeam,
  fetchTeamActiveBookings,
  fetchTeamRoster,
  reassignAmbulanceRequest,
  reassignJob,
  useSessionStore,
} from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function ReassignJobScreen() {
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
    bookingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    bookingPrice: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    bookingMeta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
    reassignButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reassignButtonLabel: { fontSize: 11.5, fontWeight: "700", color: colors.primary },
    pickerList: { gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
    pickerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: colors.bg,
      borderRadius: 10,
    },
    pickerLabel: { fontSize: 12.5, fontWeight: "600", color: colors.ink, textTransform: "capitalize" },
    pickerMeta: { fontSize: 11.5, fontWeight: "700", color: colors.primary },
    escalatedCard: { gap: 10, borderWidth: 1, borderColor: colors.error },
    escalatedBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    escalatedBadgeText: { fontSize: 11, fontWeight: "700", color: colors.error },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedAmbulanceRequestId, setSelectedAmbulanceRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: team } = useQuery({
    queryKey: ["myTeam", userId],
    queryFn: () => fetchMyTeam(userId as string),
    enabled: Boolean(userId),
  });
  const { data: roster } = useQuery({
    queryKey: ["teamRoster", team?.id],
    queryFn: () => fetchTeamRoster(team?.id as string),
    enabled: Boolean(team?.id),
  });
  const { data: activeBookings } = useQuery({
    queryKey: ["teamActiveBookings", team?.id],
    queryFn: () => fetchTeamActiveBookings((roster ?? []).map((m) => m.professional_id)),
    enabled: Boolean(team?.id) && roster !== undefined,
  });
  const { data: escalatedBookings } = useQuery({
    queryKey: ["escalatedBookings"],
    queryFn: fetchEscalatedBookings,
  });
  const { data: escalatedAmbulanceRequests } = useQuery({
    queryKey: ["escalatedAmbulanceRequests"],
    queryFn: fetchEscalatedAmbulanceRequests,
  });

  async function handleReassign(bookingId: string, professionalId: string) {
    setIsSubmitting(true);
    try {
      await reassignJob(bookingId, professionalId);
      void queryClient.invalidateQueries({ queryKey: ["teamActiveBookings"] });
      void queryClient.invalidateQueries({ queryKey: ["escalatedBookings"] });
      setSelectedBookingId(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignAmbulance(requestId: string, professionalId: string) {
    setIsSubmitting(true);
    try {
      await reassignAmbulanceRequest(requestId, professionalId);
      void queryClient.invalidateQueries({ queryKey: ["escalatedAmbulanceRequests"] });
      setSelectedAmbulanceRequestId(null);
    } finally {
      setIsSubmitting(false);
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
        <Text style={styles.title}>Reassign job</Text>
      </View>

      {(escalatedBookings?.length ?? 0) > 0 || (escalatedAmbulanceRequests?.length ?? 0) > 0 ? (
        <View style={{ gap: 10 }}>
          <View style={styles.escalatedBadgeRow}>
            <AlertTriangle size={15} color={colors.error} strokeWidth={1.8} />
            <Text style={styles.escalatedBadgeText}>Needs attention — nobody&apos;s accepted these yet</Text>
          </View>

          {(escalatedBookings ?? []).map((booking) => (
            <Card key={booking.id} style={styles.escalatedCard}>
              <View style={styles.bookingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingPrice}>₹{booking.price} · booking</Text>
                  <Text style={styles.bookingMeta}>{new Date(booking.scheduled_at).toLocaleString("en-IN")}</Text>
                </View>
                <Pressable
                  style={styles.reassignButton}
                  onPress={() => setSelectedBookingId(selectedBookingId === booking.id ? null : booking.id)}
                >
                  <ArrowRightLeft size={14} color={colors.primary} strokeWidth={1.8} />
                  <Text style={styles.reassignButtonLabel}>Assign</Text>
                </Pressable>
              </View>

              {selectedBookingId === booking.id ? (
                <View style={styles.pickerList}>
                  {(roster ?? [])
                    .filter((member) => member.status === "active")
                    .map((member) => (
                      <Pressable
                        key={member.id}
                        style={styles.pickerRow}
                        onPress={() => void handleReassign(booking.id, member.professional_id)}
                      >
                        <Text style={styles.pickerLabel}>{member.role}</Text>
                        <Text style={styles.pickerMeta}>{isSubmitting ? "..." : "Assign"}</Text>
                      </Pressable>
                    ))}
                </View>
              ) : null}
            </Card>
          ))}

          {(escalatedAmbulanceRequests ?? []).map((request) => (
            <Card key={request.id} style={styles.escalatedCard}>
              <View style={styles.bookingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingPrice}>{request.type} ambulance</Text>
                  <Text style={styles.bookingMeta}>{new Date(request.created_at).toLocaleString("en-IN")}</Text>
                </View>
                <Pressable
                  style={styles.reassignButton}
                  onPress={() =>
                    setSelectedAmbulanceRequestId(selectedAmbulanceRequestId === request.id ? null : request.id)
                  }
                >
                  <ArrowRightLeft size={14} color={colors.primary} strokeWidth={1.8} />
                  <Text style={styles.reassignButtonLabel}>Assign</Text>
                </Pressable>
              </View>

              {selectedAmbulanceRequestId === request.id ? (
                <View style={styles.pickerList}>
                  {(roster ?? [])
                    .filter((member) => member.status === "active" && member.role === "ambulance")
                    .map((member) => (
                      <Pressable
                        key={member.id}
                        style={styles.pickerRow}
                        onPress={() => void handleAssignAmbulance(request.id, member.professional_id)}
                      >
                        <Text style={styles.pickerLabel}>{member.role}</Text>
                        <Text style={styles.pickerMeta}>{isSubmitting ? "..." : "Assign"}</Text>
                      </Pressable>
                    ))}
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {activeBookings === undefined ? (
        <Skeleton height={80} borderRadius={13} />
      ) : activeBookings.length === 0 ? (
        <EmptyState icon={<Briefcase size={26} color={colors.primary} strokeWidth={1.6} />} title="No active jobs on your team" />
      ) : (
        <View style={{ gap: 10 }}>
          {activeBookings.map((booking) => (
            <Card key={booking.id} style={{ gap: 10 }}>
              <View style={styles.bookingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingPrice}>₹{booking.price}</Text>
                  <Text style={styles.bookingMeta}>{new Date(booking.scheduled_at).toLocaleString("en-IN")}</Text>
                </View>
                <Pressable
                  style={styles.reassignButton}
                  onPress={() => setSelectedBookingId(selectedBookingId === booking.id ? null : booking.id)}
                >
                  <ArrowRightLeft size={14} color={colors.primary} strokeWidth={1.8} />
                  <Text style={styles.reassignButtonLabel}>Reassign</Text>
                </Pressable>
              </View>

              {selectedBookingId === booking.id ? (
                <View style={styles.pickerList}>
                  {(roster ?? [])
                    .filter((member) => member.professional_id !== booking.professional_id)
                    .map((member) => (
                      <Pressable
                        key={member.id}
                        style={styles.pickerRow}
                        onPress={() => void handleReassign(booking.id, member.professional_id)}
                      >
                        <Text style={styles.pickerLabel}>{member.role}</Text>
                        <Text style={styles.pickerMeta}>{isSubmitting ? "..." : "Assign"}</Text>
                      </Pressable>
                    ))}
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
