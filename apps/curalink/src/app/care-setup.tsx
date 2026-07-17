import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Baby, Check, PawPrint, User, Users } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createFamilyMember, supabase } from "@curalink/api-client";
import { Button, curalinkFonts, useTheme } from "@curalink/ui";


interface CareOption {
  key: "self" | "parent" | "child" | "pet";
  label: string;
  description: string;
  Icon: typeof User;
  relation: string;
  iconColorSelected: string;
}

export default function CareSetupScreen() {
  const { colors } = useTheme();

  const options: CareOption[] = [
    { key: "self", label: "Myself", description: "Book care in your own name", Icon: User, relation: "Self", iconColorSelected: colors.primary },
    { key: "parent", label: "A parent", description: "Aging parents, near or far", Icon: Users, relation: "Parent", iconColorSelected: colors.primary },
    { key: "child", label: "A child", description: "Fevers, jabs and checkups", Icon: Baby, relation: "Child", iconColorSelected: colors.primary },
    { key: "pet", label: "A pet", description: "Vet visits and grooming", Icon: PawPrint, relation: "Pet", iconColorSelected: "#B87333" },
  ];
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
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      marginTop: 28,
    },
    card: {
      width: "47%",
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16,
    },
    cardSelected: {
      backgroundColor: colors.successTint,
      borderColor: colors.primary,
    },
    checkbox: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    iconChip: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    cardLabel: {
      fontFamily: curalinkFonts.headingSemibold,
      fontSize: 14.5,
      color: colors.ink,
    },
    cardDescription: {
      fontSize: 11.5,
      color: colors.muted2,
      marginTop: 4,
    },
    cta: {
      marginTop: 32,
    },
        }),
      [colors],
    );
  const [selected, setSelected] = useState<Record<string, boolean>>({ self: false, parent: true, child: false, pet: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggle(key: string) {
    setSelected((s) => ({ ...s, [key]: !s[key] }));
  }

  async function handleContinue() {
    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ownerId = session?.user.id;
      if (!ownerId) return;

      const fullName = session?.user.user_metadata?.full_name ?? "Me";
      const chosen = options.filter((o) => selected[o.key]);
      // Always ensure a "self" row exists even if the user didn't tap
      // "Myself" -- every account needs at least one bookable patient.
      if (!selected.self) {
        await createFamilyMember({ owner_id: ownerId, full_name: fullName, relation: "Self", is_self: true });
      }
      for (const option of chosen) {
        await createFamilyMember({
          owner_id: ownerId,
          full_name: option.key === "self" ? fullName : option.label,
          relation: option.relation,
          is_self: option.key === "self",
        });
      }
      router.replace("/(tabs)/home");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ONE LAST THING</Text>
      <Text style={styles.title}>Who are you caring for?</Text>
      <Text style={styles.subtitle}>Pick everyone that applies — we&apos;ll tailor CuraLink around them.</Text>

      <View style={styles.grid}>
        {options.map((option) => {
          const isSelected = selected[option.key];
          return (
            <Pressable
              key={option.key}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggle(option.key)}
            >
              <View
                style={[
                  styles.checkbox,
                  { backgroundColor: isSelected ? colors.primary : colors.surface, borderColor: isSelected ? colors.primary : colors.border },
                ]}
              >
                {isSelected ? <Check size={13} color="#FFFFFF" /> : null}
              </View>
              <View style={[styles.iconChip, { backgroundColor: isSelected ? colors.successTint : colors.chipNeutral }]}>
                <option.Icon size={22} color={isSelected ? option.iconColorSelected : colors.muted} strokeWidth={1.8} />
              </View>
              <Text style={styles.cardLabel}>{option.label}</Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={isSubmitting ? "Setting up..." : "Set up my home"}
        disabled={isSubmitting}
        onPress={() => void handleContinue()}
        style={styles.cta}
      />
    </View>
  );
}
