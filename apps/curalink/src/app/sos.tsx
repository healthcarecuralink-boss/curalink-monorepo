import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Siren } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createAmbulanceRequest, fetchAddresses, fetchEmergencyContacts, useSessionStore } from "@curalink/api-client";
import { Button, Card, curalinkFonts, useTheme } from "@curalink/ui";


export default function SosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
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
    iconWrap: { alignItems: "center", marginTop: 8 },
    headline: { fontFamily: curalinkFonts.heading, fontSize: 19, color: colors.ink, textAlign: "center" },
    subtitle: { fontSize: 13, color: colors.muted2, textAlign: "center", lineHeight: 19 },
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: colors.ink },
    contactRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
    contactName: { flex: 1, fontSize: 12.5, color: colors.ink },
    contactPhone: { fontSize: 12.5, color: colors.muted2 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const consumerId = session?.user.id;
  const [isRequesting, setIsRequesting] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ["addresses", consumerId],
    queryFn: () => fetchAddresses(consumerId as string),
    enabled: Boolean(consumerId),
  });
  const { data: emergencyContacts } = useQuery({
    queryKey: ["emergencyContacts", consumerId],
    queryFn: () => fetchEmergencyContacts(consumerId as string),
    enabled: Boolean(consumerId),
  });

  async function handleConfirm() {
    if (!consumerId) return;
    setIsRequesting(true);
    try {
      const request = await createAmbulanceRequest({
        consumer_id: consumerId,
        type: "ALS",
        reason: "SOS emergency request",
        pickup_address_id: addresses?.[0]?.id ?? null,
      });
      router.replace(`/ambulance/${request.id}`);
    } finally {
      setIsRequesting(false);
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
        <Text style={styles.title}>Emergency SOS</Text>
      </View>

      <View style={styles.iconWrap}>
        <Siren size={40} color={colors.error} strokeWidth={1.6} />
      </View>
      <Text style={styles.headline}>Request an ambulance immediately</Text>
      <Text style={styles.subtitle}>
        We&apos;ll dispatch the nearest available ALS ambulance to{" "}
        {addresses?.[0] ? `${addresses[0].line1}, ${addresses[0].neighborhood ?? addresses[0].city}` : "your default address"}.
      </Text>

      <Button
        label={isRequesting ? "Requesting..." : "Confirm — call ambulance now"}
        variant="destructive"
        icon={<Siren size={18} color={colors.error} />}
        disabled={isRequesting}
        onPress={() => void handleConfirm()}
      />

      {emergencyContacts && emergencyContacts.length > 0 ? (
        <Card style={{ gap: 8 }}>
          <Text style={styles.sectionTitle}>Your emergency contacts</Text>
          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <Phone size={14} color={colors.muted2} strokeWidth={1.8} />
              <Text style={styles.contactName}>{contact.full_name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}
