import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Pill, Star } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  createPharmacyOrderFromPrescription,
  fetchAddresses,
  fetchPharmacyPartners,
  fetchPrescriptionDetail,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";
import { haversineKm } from "../utils/geo";

export default function PharmacyLocatorScreen() {
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
        title: { fontFamily: curalinkFonts.heading, fontSize: 19, color: colors.ink },
        subtitle: { fontSize: 12, color: colors.muted2, marginTop: 1 },
        note: { fontSize: 11.5, color: colors.muted2, textAlign: "center" },
        partnerCard: { gap: 10 },
        partnerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
        partnerIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.chipNeutral ?? colors.border, alignItems: "center", justifyContent: "center" },
        partnerName: { fontSize: 14, fontWeight: "700", color: colors.ink },
        partnerArea: { fontSize: 11.5, color: colors.muted2, marginTop: 1 },
        distancePill: { fontSize: 11.5, fontWeight: "700", color: colors.primaryPress, backgroundColor: colors.successTint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
        ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
        ratingText: { fontSize: 12, fontWeight: "600", color: colors.ink },
      }),
    [colors],
  );

  const { prescriptionId } = useLocalSearchParams<{ prescriptionId?: string }>();
  const session = useSessionStore((s) => s.session);
  const consumerId = session?.user.id;
  const [orderingId, setOrderingId] = useState<string | null>(null);

  const { data: addresses } = useQuery({
    queryKey: ["addresses", consumerId],
    queryFn: () => fetchAddresses(consumerId as string),
    enabled: Boolean(consumerId),
  });
  const { data: partners } = useQuery({
    queryKey: ["pharmacyPartners"],
    queryFn: () => fetchPharmacyPartners(),
  });
  const { data: prescriptionDetail } = useQuery({
    queryKey: ["prescriptionDetail", prescriptionId],
    queryFn: () => fetchPrescriptionDetail(prescriptionId as string),
    enabled: Boolean(prescriptionId),
  });

  const origin = (addresses ?? []).find((a) => a.lat !== null && a.lng !== null) ?? null;

  const sortedPartners = useMemo(() => {
    if (!partners) return undefined;
    const withDistance = partners.map((partner) => ({
      partner,
      distanceKm:
        origin && partner.lat !== null && partner.lng !== null
          ? haversineKm(origin.lat as number, origin.lng as number, partner.lat, partner.lng)
          : null,
    }));
    return withDistance.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [partners, origin]);

  async function handleSendHere(pharmacyId: string) {
    if (!consumerId || !prescriptionDetail) return;
    setOrderingId(pharmacyId);
    try {
      interface Med {
        name?: string;
      }
      const order = await createPharmacyOrderFromPrescription({
        consumer_id: consumerId,
        patient_id: prescriptionDetail.prescription.patient_id,
        prescription_id: prescriptionDetail.prescription.id,
        pharmacy_id: pharmacyId,
        items: (prescriptionDetail.prescription.meds as Med[]).map((med) => ({
          name: med.name,
          qty: 1,
          in_stock: true,
        })) as never,
      });
      router.replace(`/pharmacy-orders/${order.id}`);
    } finally {
      setOrderingId(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text style={styles.title}>Pharmacy partners</Text>
          <Text style={styles.subtitle}>{prescriptionId ? "Pick one to send this prescription to" : "Sorted by distance from your address"}</Text>
        </View>
      </View>

      {!origin ? (
        <Text style={styles.note}>Add an address with a saved location to see distances — showing all partners for now.</Text>
      ) : null}

      {sortedPartners === undefined ? (
        <View style={{ gap: 10 }}>
          <Skeleton height={90} borderRadius={18} />
          <Skeleton height={90} borderRadius={18} />
        </View>
      ) : sortedPartners.length === 0 ? (
        <EmptyState icon={<Pill size={26} color={colors.primary} strokeWidth={1.6} />} title="No pharmacy partners yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {sortedPartners.map(({ partner, distanceKm }) => (
            <Card key={partner.profileId} style={styles.partnerCard}>
              <View style={styles.partnerRow}>
                <View style={styles.partnerIcon}>
                  <Pill size={19} color={colors.navy} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerName}>{partner.fullName}</Text>
                  {partner.serviceArea ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <MapPin size={11} color={colors.muted2} />
                      <Text style={styles.partnerArea}>{partner.serviceArea}</Text>
                    </View>
                  ) : null}
                </View>
                {distanceKm !== null ? (
                  <Text style={styles.distancePill}>{distanceKm < 1 ? "< 1 km" : `${distanceKm.toFixed(1)} km`}</Text>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={styles.ratingRow}>
                  <Star size={13} color="#F4A23B" fill="#F4A23B" />
                  <Text style={styles.ratingText}>{partner.rating > 0 ? partner.rating.toFixed(1) : "New partner"}</Text>
                </View>
                {prescriptionId ? (
                  <Button
                    label={orderingId === partner.profileId ? "Sending..." : "Send prescription here"}
                    variant="secondary"
                    disabled={orderingId !== null}
                    onPress={() => void handleSendHere(partner.profileId)}
                  />
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
