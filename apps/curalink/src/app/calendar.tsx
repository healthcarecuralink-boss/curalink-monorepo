import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchUpcomingBookings, useSessionStore } from "@curalink/api-client";
import { Card, EmptyState, Skeleton, StatusPill, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";


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
    default:
      return curalinkStatusPillColors.cancelled;
  }
};

export default function AppointmentCalendarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 18 },
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
    title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
    dateLabel: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13, color: colors.muted2 },
    bookingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    timeChip: { width: 56 },
    timeText: { fontSize: 11.5, fontWeight: "700", color: colors.ink },
    bookingCard: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
    bookingPrice: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: colors.ink },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const consumerId = session?.user.id;

  const { data: bookings } = useQuery({
    queryKey: ["upcomingBookings", consumerId],
    queryFn: () => fetchUpcomingBookings(consumerId as string),
    enabled: Boolean(consumerId),
  });

  const groups = new Map<string, NonNullable<typeof bookings>>();
  for (const booking of bookings ?? []) {
    const dateKey = new Date(booking.scheduled_at).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    groups.set(dateKey, [...(groups.get(dateKey) ?? []), booking]);
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
        <Text style={styles.title}>Appointments</Text>
      </View>

      {bookings === undefined ? (
        <Skeleton height={100} borderRadius={18} />
      ) : bookings.length === 0 ? (
        <EmptyState icon={<CalendarDays size={26} color={colors.primary} strokeWidth={1.6} />} title="No upcoming appointments" />
      ) : (
        [...groups.entries()].map(([dateLabel, dayBookings]) => (
          <View key={dateLabel} style={{ gap: 8 }}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            {dayBookings.map((booking) => (
              <Pressable key={booking.id} style={styles.bookingRow} onPress={() => router.push(`/bookings/${booking.id}`)}>
                <View style={styles.timeChip}>
                  <Text style={styles.timeText}>
                    {new Date(booking.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <Card style={styles.bookingCard}>
                  <Text style={styles.bookingPrice}>₹{booking.price}</Text>
                  <StatusPill label={booking.status.replace("_", " ")} {...statusPillFor(booking.status)} />
                </Card>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}
