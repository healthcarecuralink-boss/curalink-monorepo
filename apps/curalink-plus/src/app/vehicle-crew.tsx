import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Truck, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchProfessionalProfile, updateProfessionalProfile, useSessionStore } from "@curalink/api-client";
import { Button, Card, Skeleton, TextField, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";

const accent = roleAccents.ambulance;

interface CrewMember {
  name: string;
  role: string;
}

interface VehicleInfo {
  vehicle_number?: string;
  vehicle_type?: string;
  crew?: CrewMember[];
}

export default function VehicleCrewScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 14 },
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
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
    crewRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    removeButton: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 4 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const [loadedProfileId, setLoadedProfileId] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["professionalProfile", userId],
    queryFn: () => fetchProfessionalProfile(userId as string),
    enabled: Boolean(userId),
  });

  if (profile && profile.profile_id !== loadedProfileId) {
    setLoadedProfileId(profile.profile_id);
    const info = (profile.vehicle_info ?? {}) as VehicleInfo;
    setVehicleNumber(info.vehicle_number ?? "");
    setVehicleType(info.vehicle_type ?? "");
    setCrew(info.crew ?? []);
  }

  function addCrewRow() {
    setCrew((prev) => [...prev, { name: "", role: "" }]);
  }

  function updateCrewRow(index: number, patch: Partial<CrewMember>) {
    setCrew((prev) => prev.map((member, i) => (i === index ? { ...member, ...patch } : member)));
  }

  function removeCrewRow(index: number) {
    setCrew((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!userId) return;
    setIsSaving(true);
    try {
      const vehicle_info: VehicleInfo = { vehicle_number: vehicleNumber, vehicle_type: vehicleType, crew };
      await updateProfessionalProfile(userId, { vehicle_info: vehicle_info as never });
      void queryClient.invalidateQueries({ queryKey: ["professionalProfile", userId] });
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Skeleton height={140} borderRadius={13} />
      </View>
    );
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
        <Text style={styles.title}>Vehicle & crew</Text>
      </View>

      <Card style={{ gap: 12 }}>
        <View style={styles.sectionHeader}>
          <Truck size={16} color={accent} strokeWidth={1.8} />
          <Text style={styles.sectionTitle}>Vehicle</Text>
        </View>
        <TextField label="Registration number" autoCapitalize="characters" value={vehicleNumber} onChangeText={setVehicleNumber} />
        <TextField label="Vehicle type" placeholder="e.g. BLS van, ALS van" value={vehicleType} onChangeText={setVehicleType} />
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={styles.sectionHeader}>
          <Users size={16} color={accent} strokeWidth={1.8} />
          <Text style={styles.sectionTitle}>Crew</Text>
        </View>
        {crew.map((member, i) => (
          <View key={i} style={styles.crewRow}>
            <View style={{ flex: 1, gap: 8 }}>
              <TextField placeholder="Name" value={member.name} onChangeText={(v) => updateCrewRow(i, { name: v })} />
              <TextField placeholder="Role (e.g. EMT, driver)" value={member.role} onChangeText={(v) => updateCrewRow(i, { role: v })} />
            </View>
            <Pressable style={styles.removeButton} onPress={() => removeCrewRow(i)}>
              <Trash2 size={16} color={colors.error} strokeWidth={1.8} />
            </Pressable>
          </View>
        ))}
        <Button label="Add crew member" variant="secondary" icon={<Plus size={16} color={colors.ink} />} onPress={addCrewRow} />
      </Card>

      <Button label={isSaving ? "Saving..." : "Save"} disabled={isSaving} onPress={() => void handleSave()} />
    </ScrollView>
  );
}
