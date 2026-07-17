import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  createAddress,
  createAmbulanceRequest,
  fetchAddresses,
  fetchConsumerAmbulanceRequests,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, StatusPill, TextField, curalinkFonts, curalinkStatusPillColors, useTheme } from "@curalink/ui";

const types = ["BLS", "ALS"] as const;

const statusPillFor = (status: string) => {
  switch (status) {
    case "requested":
      return curalinkStatusPillColors.pending;
    case "accepted":
    case "en_route":
    case "arrived":
      return curalinkStatusPillColors.confirmed;
    case "transporting":
      return curalinkStatusPillColors.enRoute;
    case "completed":
      return curalinkStatusPillColors.completed;
    default:
      return curalinkStatusPillColors.cancelled;
  }
};

export default function AmbulanceScreen() {
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
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted, marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: { backgroundColor: "#FCE8E8", borderColor: colors.error },
    chipText: { fontSize: 12.5, fontWeight: "600", color: colors.muted },
    chipTextSelected: { color: colors.error },
    addressLine: { fontSize: 13, color: colors.ink2, marginTop: 2 },
    requestRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 16,
      padding: 14,
    },
    requestTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: colors.ink },
    requestMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const consumerId = session?.user.id;
  const queryClient = useQueryClient();

  const [type, setType] = useState<(typeof types)[number]>("BLS");
  const [patientInit, setPatientInit] = useState("");
  const [reason, setReason] = useState("");
  const [hospital, setHospital] = useState("");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ["addresses", consumerId],
    queryFn: () => fetchAddresses(consumerId as string),
    enabled: Boolean(consumerId),
  });
  const { data: requests } = useQuery({
    queryKey: ["consumerAmbulanceRequests", consumerId],
    queryFn: () => fetchConsumerAmbulanceRequests(consumerId as string),
    enabled: Boolean(consumerId),
  });

  async function handleRequest() {
    if (!consumerId) return;
    setIsRequesting(true);
    try {
      let pickupAddressId = addresses?.[0]?.id;
      if (!pickupAddressId && newAddressLine.trim()) {
        const created = await createAddress({
          owner_id: consumerId,
          label: "Emergency pickup",
          line1: newAddressLine,
        });
        pickupAddressId = created.id;
      }
      const request = await createAmbulanceRequest({
        consumer_id: consumerId,
        type,
        patient_init: patientInit || null,
        reason: reason || null,
        hospital: hospital || null,
        pickup_address_id: pickupAddressId ?? null,
      });
      void queryClient.invalidateQueries({ queryKey: ["consumerAmbulanceRequests"] });
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
        <Text style={styles.title}>Ambulance</Text>
      </View>

      <Card style={{ gap: 14 }}>
        <Text style={styles.sectionTitle}>Request an ambulance</Text>

        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.chipRow}>
          {types.map((option) => {
            const isSelected = option === type;
            return (
              <Pressable key={option} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => setType(option)}>
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {option === "BLS" ? "BLS — Basic" : "ALS — Advanced"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextField label="Patient initials" placeholder="e.g. R.N." value={patientInit} onChangeText={setPatientInit} />
        <TextField label="Reason (optional)" placeholder="e.g. Chest pain" value={reason} onChangeText={setReason} />
        <TextField label="Destination hospital (optional)" value={hospital} onChangeText={setHospital} />

        {addresses === undefined ? null : addresses.length === 0 ? (
          <TextField
            label="Pickup address"
            placeholder="Where should the ambulance come?"
            value={newAddressLine}
            onChangeText={setNewAddressLine}
          />
        ) : (
          <View>
            <Text style={styles.fieldLabel}>Pickup address</Text>
            <Text style={styles.addressLine}>
              {addresses[0]?.line1}, {addresses[0]?.neighborhood ?? addresses[0]?.city}
            </Text>
          </View>
        )}

        <Button
          label={isRequesting ? "Requesting..." : "Request ambulance now"}
          disabled={isRequesting}
          onPress={() => void handleRequest()}
        />
      </Card>

      <Text style={styles.sectionTitle}>Past requests</Text>
      {requests === undefined ? (
        <Skeleton height={70} borderRadius={16} />
      ) : requests.length === 0 ? (
        <EmptyState icon={<MapPin size={26} color={colors.primary} strokeWidth={1.6} />} title="No requests yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {requests.map((request) => (
            <Pressable key={request.id} style={styles.requestRow} onPress={() => router.push(`/ambulance/${request.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestTitle}>
                  {request.type} · {request.patient_init ?? "Patient"}
                </Text>
                <Text style={styles.requestMeta}>{new Date(request.created_at).toLocaleString("en-IN")}</Text>
              </View>
              <StatusPill label={request.status.replace("_", " ")} {...statusPillFor(request.status)} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
