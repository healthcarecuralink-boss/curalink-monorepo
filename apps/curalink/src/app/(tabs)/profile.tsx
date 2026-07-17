import { useMemo } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlarmClock,
  Ambulance,
  Award,
  Bell,
  Calendar,
  ChevronRight,
  Droplet,
  FileText,
  Gift,
  HelpCircle,
  LogOut,
  MapPin,
  Newspaper,
  Phone,
  Pill,
  Plus,
  Salad,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchFamilyMembers, signOut, useSessionStore } from "@curalink/api-client";
import { Button, Card, ErrorState, Skeleton, curalinkFonts, useTheme } from "@curalink/ui";


const relationEmoji: Record<string, string> = {
  Self: "🧑",
  Father: "👴",
  Mother: "👵",
  Parent: "👴",
  Son: "🧒",
  Daughter: "🧒",
  Child: "🧒",
  Pet: "🐾",
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 66, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
    title: { fontFamily: curalinkFonts.heading, fontSize: 25, color: colors.ink },
    identityCard: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.navy2,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontFamily: curalinkFonts.heading, fontSize: 18, color: "#EAF3EE" },
    name: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: colors.ink },
    phone: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
    upsellCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.navy,
      borderRadius: 18,
      padding: 15,
    },
    upsellIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
    upsellTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 13.5, color: "#FFFFFF" },
    upsellBody: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 15, color: colors.ink },
    familyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 16,
      padding: 13,
    },
    familyEmoji: { fontSize: 22 },
    familyName: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    familyRelation: { fontSize: 11.5, color: colors.muted2, marginTop: 1 },
    linkList: { gap: 2 },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    linkLabel: { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.ink },
        }),
      [colors],
    );
  const profile = useSessionStore((s) => s.profile);
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  const {
    data: familyMembers,
    isError: familyMembersError,
    refetch: refetchFamilyMembers,
  } = useQuery({
    queryKey: ["familyMembers", userId],
    queryFn: () => fetchFamilyMembers(userId as string),
    enabled: Boolean(userId),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.full_name?.[0] ?? "?"}</Text>
        </View>
        <View>
          <Text style={styles.name}>{profile?.full_name ?? "..."}</Text>
          <Text style={styles.phone}>{session?.user.phone}</Text>
        </View>
      </Card>

      <Pressable style={styles.upsellCard} onPress={() => router.push("/subscription-plans")}>
        <View style={styles.upsellIcon}>
          <Sparkles size={18} color="#FFFFFF" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.upsellTitle}>Upgrade to Care Plus</Text>
          <Text style={styles.upsellBody}>10% off visits, priority slots, free medicine delivery</Text>
        </View>
        <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
      </Pressable>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Family & pets</Text>
        <Pressable onPress={() => router.push("/family/add")}>
          <Plus size={18} color={colors.primary} strokeWidth={2} />
        </Pressable>
      </View>
      {familyMembersError ? (
        <ErrorState onRetry={() => void refetchFamilyMembers()} />
      ) : familyMembers === undefined ? (
        <Skeleton height={60} borderRadius={16} />
      ) : (
        <View style={{ gap: 8 }}>
          {familyMembers.map((member) => (
            <Pressable key={member.id} style={styles.familyRow} onPress={() => router.push(`/family/${member.id}`)}>
              <Text style={styles.familyEmoji}>{relationEmoji[member.relation] ?? "🧑"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.familyName}>{member.full_name}</Text>
                <Text style={styles.familyRelation}>{member.relation}</Text>
              </View>
              <ChevronRight size={18} color={colors.faint2} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.linkList}>
        <Pressable style={styles.linkRow} onPress={() => router.push("/medical-records")}>
          <FileText size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Medical records</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/vitals")}>
          <Activity size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Vitals</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/medical-team")}>
          <Users size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Medical team</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/emergency-contacts")}>
          <Phone size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Emergency contacts</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/prescriptions")}>
          <Stethoscope size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Prescriptions</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/lab-orders")}>
          <Activity size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Lab reports</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/pharmacy-orders")}>
          <Pill size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Pharmacy orders</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/pharmacy-locator")}>
          <MapPin size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Pharmacy locator</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/ambulance")}>
          <Ambulance size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Ambulance</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/calendar")}>
          <Calendar size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Appointment calendar</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/reminders")}>
          <AlarmClock size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Reminders</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/diet-plan")}>
          <Salad size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Diet & nutrition plan</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/second-opinion")}>
          <Stethoscope size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Second opinion</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/notifications")}>
          <Bell size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Notifications</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/health-articles")}>
          <Newspaper size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Health articles</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/loyalty-rewards")}>
          <Award size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Loyalty rewards</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/refer-a-friend")}>
          <Gift size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Refer a friend</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/donate")}>
          <Droplet size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Donate & blood requests</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/help-center")}>
          <HelpCircle size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Help center</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/settings")}>
          <Settings size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Settings</Text>
          <ChevronRight size={16} color={colors.faint2} />
        </Pressable>
      </View>

      <Button
        label="Sign out"
        variant="destructive"
        icon={<LogOut size={16} color={colors.error} />}
        onPress={() => void signOut()}
      />
    </ScrollView>
  );
}
