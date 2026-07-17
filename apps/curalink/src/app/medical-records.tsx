import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchFamilyMembers, useSessionStore } from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";


export default function MedicalRecordsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 20 },
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
    name: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: colors.ink, marginBottom: 8 },
    relation: { fontFamily: curalinkFonts.body, fontSize: 12.5, color: colors.muted },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.divider },
    label: { fontSize: 12, color: colors.muted },
    value: { fontSize: 12.5, color: colors.ink, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 12 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const { data: familyMembers } = useQuery({
    queryKey: ["familyMembers", userId],
    queryFn: () => fetchFamilyMembers(userId as string),
    enabled: Boolean(userId),
  });

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
        <Text style={styles.title}>Medical records</Text>
      </View>

      {familyMembers === undefined ? (
        <Skeleton height={100} borderRadius={16} />
      ) : familyMembers.length === 0 ? (
        <EmptyState icon={<FileText size={26} color={colors.primary} strokeWidth={1.6} />} title="No records yet" />
      ) : (
        <View style={{ gap: 12 }}>
          {familyMembers.map((member) => (
            <Card key={member.id}>
              <Text style={styles.name}>
                {member.full_name} <Text style={styles.relation}>· {member.relation}</Text>
              </Text>
              <View style={styles.row}>
                <Text style={styles.label}>Blood group</Text>
                <Text style={styles.value}>{member.blood_group ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Allergies</Text>
                <Text style={styles.value}>{member.allergies.length ? member.allergies.join(", ") : "None known"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Conditions</Text>
                <Text style={styles.value}>{member.conditions.length ? member.conditions.join(", ") : "None"}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
