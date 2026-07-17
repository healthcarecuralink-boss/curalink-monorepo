import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Minus, Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { updateProfessionalProfile, useSessionStore } from "@curalink/api-client";
import { Button, curalinkPlusFonts, useTheme } from "@curalink/ui";


const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
const areas = ["Jubilee Hills", "Banjara Hills", "Kondapur", "Madhapur", "Gachibowli", "Secunderabad"];

export default function AvailabilitySetupScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 90 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 4 },
    sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.muted, marginTop: 24, marginBottom: 10 },
    dayRow: { flexDirection: "row", gap: 8 },
    dayButton: {
      width: 38,
      height: 38,
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
    areaChip: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
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
    cta: { marginTop: 32 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const [days, setDays] = useState<boolean[]>([true, true, true, true, true, true, false]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Jubilee Hills", "Banjara Hills", "Kondapur"]);
  const [maxDistance, setMaxDistance] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleDay(index: number) {
    setDays((prev) => prev.map((d, i) => (i === index ? !d : d)));
  }

  function toggleArea(area: string) {
    setSelectedAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  async function handleContinue() {
    const userId = session?.user.id;
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await updateProfessionalProfile(userId, {
        availability: { days, areas: selectedAreas, max_distance_km: maxDistance },
        service_area: selectedAreas[0] ?? null,
        is_on_duty: true,
      });
      router.replace("/(tabs)/home");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>When and where can you work?</Text>
      <Text style={styles.subtitle}>You can change this anytime from Schedule.</Text>

      <Text style={styles.sectionLabel}>Days available</Text>
      <View style={styles.dayRow}>
        {dayLabels.map((label, index) => {
          const isSelected = days[index];
          return (
            <Pressable
              key={index}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => toggleDay(index)}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Service areas</Text>
      <View style={styles.areaRow}>
        {areas.map((area) => {
          const isSelected = selectedAreas.includes(area);
          return (
            <Pressable
              key={area}
              style={[styles.areaChip, isSelected && styles.areaChipSelected]}
              onPress={() => toggleArea(area)}
            >
              <Text style={[styles.areaText, isSelected && styles.areaTextSelected]}>{area}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Max travel distance</Text>
      <View style={styles.distanceRow}>
        <Pressable
          style={styles.distanceButton}
          onPress={() => setMaxDistance((d) => Math.max(2, d - 1))}
        >
          <Minus size={16} color={colors.ink} />
        </Pressable>
        <Text style={styles.distanceValue}>Within {maxDistance} km</Text>
        <Pressable
          style={styles.distanceButton}
          onPress={() => setMaxDistance((d) => Math.min(30, d + 1))}
        >
          <Plus size={16} color={colors.ink} />
        </Pressable>
      </View>

      <Button
        label={isSubmitting ? "Saving..." : "Go to my dashboard"}
        disabled={isSubmitting}
        onPress={() => void handleContinue()}
        style={styles.cta}
      />
    </View>
  );
}
