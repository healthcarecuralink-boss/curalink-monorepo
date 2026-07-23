import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Check, MapPin } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createAddress, fetchFamilyMembers, supabase } from "@curalink/api-client";
import { Button, curalinkFonts, useTheme } from "@curalink/ui";

// Tentative area only -- a lightweight, no-permissions-needed stand-in for a
// real GPS/geocoded address. Matches the chip-picker pattern CuraLink Plus
// uses for provider service areas (see apps/curalink-plus/availability-setup.tsx),
// not actual live location. A precise address is still collected later at
// booking time (booking/new.tsx) if the user needs one.
const areas = ["Jubilee Hills", "Banjara Hills", "Kondapur", "Madhapur", "Gachibowli", "Secunderabad"];

export default function LocationSetupScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: 24,
          paddingTop: 90,
        },
        eyebrow: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.6,
          color: colors.primary,
        },
        title: {
          fontFamily: curalinkFonts.heading,
          fontSize: 27,
          color: colors.ink,
          marginTop: 8,
        },
        subtitle: {
          fontSize: 14,
          color: colors.muted,
          marginTop: 8,
          lineHeight: 22,
        },
        areaRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 28,
        },
        areaChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 99,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        areaChipSelected: {
          backgroundColor: colors.successTint,
          borderColor: colors.primary,
        },
        areaText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.muted,
        },
        areaTextSelected: {
          color: colors.ink,
        },
        cta: {
          marginTop: 32,
        },
        skip: {
          marginTop: 16,
          alignSelf: "center",
          fontSize: 13,
          color: colors.muted,
          fontWeight: "700",
        },
      }),
    [colors],
  );

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function goNext(ownerId: string) {
    const familyMembers = await fetchFamilyMembers(ownerId);
    router.replace(familyMembers.length > 0 ? "/(tabs)/home" : "/care-setup");
  }

  async function handleContinue() {
    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ownerId = session?.user.id;
      if (!ownerId) return;

      if (selectedArea) {
        await createAddress({
          owner_id: ownerId,
          label: "Home",
          line1: selectedArea,
          neighborhood: selectedArea,
          city: "Hyderabad",
          state: "Telangana",
          is_default: true,
        });
      }
      await goNext(ownerId);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ownerId = session?.user.id;
      if (!ownerId) return;
      await goNext(ownerId);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>WHERE ARE YOU?</Text>
      <Text style={styles.title}>Which area are you in?</Text>
      <Text style={styles.subtitle}>
        A tentative location helps us match nearby caregivers faster. You can add an exact address later at booking.
      </Text>

      <View style={styles.areaRow}>
        {areas.map((area) => {
          const isSelected = selectedArea === area;
          return (
            <Pressable
              key={area}
              style={[styles.areaChip, isSelected && styles.areaChipSelected]}
              onPress={() => setSelectedArea(area)}
            >
              {isSelected ? (
                <Check size={14} color={colors.primary} strokeWidth={2.5} />
              ) : (
                <MapPin size={14} color={colors.muted} strokeWidth={1.8} />
              )}
              <Text style={[styles.areaText, isSelected && styles.areaTextSelected]}>{area}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={isSubmitting ? "Saving..." : "Continue"}
        disabled={isSubmitting || !selectedArea}
        onPress={() => void handleContinue()}
        style={styles.cta}
      />
      <Text style={styles.skip} onPress={() => void handleSkip()}>
        Skip for now
      </Text>
    </View>
  );
}
