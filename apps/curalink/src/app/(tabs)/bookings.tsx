import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Star } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchPastBookings, fetchServices, fetchUpcomingBookings, useSessionStore } from "@curalink/api-client";
import { EmptyState, ErrorState, Skeleton, StatusPill, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";


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

const statusLabel: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  en_route: "En route",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function BookingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 66, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
    title: { fontFamily: curalinkFonts.heading, fontSize: 25, color: colors.ink },
    tabRow: { flexDirection: "row", gap: 8 },
    tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: "700", color: colors.muted },
    tabTextActive: { color: "#FFFFFF" },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 18,
      padding: 15,
      gap: 10,
    },
    serviceName: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14.5, color: colors.ink },
    date: { fontSize: 12, color: colors.muted, marginTop: 3 },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
    ratingText: { fontSize: 12, fontWeight: "700", color: colors.ink },
        }),
      [colors],
    );
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const {
    data: upcoming,
    isError: upcomingError,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: ["upcomingBookings", userId],
    queryFn: () => fetchUpcomingBookings(userId as string),
    enabled: Boolean(userId),
  });
  const {
    data: past,
    isError: pastError,
    refetch: refetchPast,
  } = useQuery({
    queryKey: ["pastBookings", userId],
    queryFn: () => fetchPastBookings(userId as string),
    enabled: Boolean(userId),
  });
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: () => fetchServices() });

  const bookings = tab === "upcoming" ? upcoming : past;
  const bookingsError = tab === "upcoming" ? upcomingError : pastError;
  const refetchBookings = tab === "upcoming" ? refetchUpcoming : refetchPast;
  const serviceName = (serviceId: string) => services?.find((s) => s.id === serviceId)?.name ?? "Visit";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bookings</Text>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === "upcoming" && styles.tabActive]} onPress={() => setTab("upcoming")}>
          <Text style={[styles.tabText, tab === "upcoming" && styles.tabTextActive]}>Upcoming</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "past" && styles.tabActive]} onPress={() => setTab("past")}>
          <Text style={[styles.tabText, tab === "past" && styles.tabTextActive]}>Past</Text>
        </Pressable>
      </View>

      {bookingsError ? (
        <ErrorState onRetry={() => void refetchBookings()} />
      ) : bookings === undefined ? (
        <Skeleton height={90} borderRadius={18} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} color={colors.primary} strokeWidth={1.6} />}
          title={tab === "upcoming" ? "No upcoming visits" : "No past visits yet"}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {bookings.map((booking) => (
            <Pressable key={booking.id} style={styles.card} onPress={() => router.push(`/bookings/${booking.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{serviceName(booking.service_id)}</Text>
                <Text style={styles.date}>{new Date(booking.scheduled_at).toLocaleString("en-IN")}</Text>
                {booking.rating ? (
                  <View style={styles.ratingRow}>
                    <Star size={12} color={colors.star} fill={colors.star} />
                    <Text style={styles.ratingText}>{booking.rating}</Text>
                  </View>
                ) : null}
              </View>
              <StatusPill label={statusLabel[booking.status] ?? booking.status} {...statusPillFor(booking.status)} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
