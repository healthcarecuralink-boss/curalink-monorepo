import { useMemo } from "react";
import { router } from "expo-router";
import { Bell, ChevronRight, HelpCircle, LogOut, MessageCircle, Settings, Star, UserPlus, Wallet } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { signOut, useSessionStore } from "@curalink/api-client";
import { Button, Card, curalinkPlusFonts, roleAccents, useTheme } from "@curalink/ui";


export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
    card: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    avatarText: { fontFamily: curalinkPlusFonts.heading, fontSize: 18, color: "#FFFFFF" },
    name: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 15, color: colors.ink },
    phone: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
    roles: { fontSize: 11.5, color: colors.muted, marginTop: 2, textTransform: "capitalize" },
    linkList: { gap: 2 },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 14,
    },
    linkLabel: { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.ink },
        }),
      [colors],
    );
  const profile = useSessionStore((s) => s.profile);
  const session = useSessionStore((s) => s.session);
  const activeRole = useSessionStore((s) => s.activeRole);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <Card style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: activeRole ? roleAccents[activeRole] : colors.primary }]}>
          <Text style={styles.avatarText}>{profile?.full_name?.[0] ?? "?"}</Text>
        </View>
        <View>
          <Text style={styles.name}>{profile?.full_name ?? "..."}</Text>
          <Text style={styles.phone}>{session?.user.phone}</Text>
          <Text style={styles.roles}>{profile?.roles.join(", ") ?? ""}</Text>
        </View>
      </Card>

      <View style={styles.linkList}>
        <Pressable style={styles.linkRow} onPress={() => router.push("/payout-methods")}>
          <Wallet size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Payout methods</Text>
          <ChevronRight size={16} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/reviews")}>
          <Star size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Reviews</Text>
          <ChevronRight size={16} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/team-chat")}>
          <MessageCircle size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Team chat</Text>
          <ChevronRight size={16} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/add-role")}>
          <UserPlus size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Add another role</Text>
          <ChevronRight size={16} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/notifications")}>
          <Bell size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Notifications</Text>
          <ChevronRight size={16} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/help-center")}>
          <HelpCircle size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Help center</Text>
          <ChevronRight size={16} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push("/settings")}>
          <Settings size={18} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.linkLabel}>Settings</Text>
          <ChevronRight size={16} color={colors.muted} />
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
