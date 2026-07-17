import { useMemo } from "react";
import { router } from "expo-router";
import { ArrowLeft, Bell, ChevronRight, Globe, LogOut, Moon, Palette } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { signOut } from "@curalink/api-client";
import { Button, Card, curalinkPlusFonts, useTheme } from "@curalink/ui";


export default function SettingsScreen() {
  const { colors, colorScheme, toggleColorScheme } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 12 },
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
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    rowLabel: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
    rowNote: { fontSize: 11, color: colors.muted, marginTop: 2 },
        }),
      [colors],
    );
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
        <Text style={styles.title}>Settings</Text>
      </View>

      <Pressable onPress={() => router.push("/notification-preferences")} accessibilityRole="button">
        <Card style={styles.row}>
          <Bell size={18} color={colors.muted} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Text style={styles.rowNote}>Push notifications and category preferences</Text>
          </View>
          <ChevronRight size={16} color={colors.muted} />
        </Card>
      </Pressable>

      <Card style={styles.row}>
        <Moon size={18} color={colors.muted} strokeWidth={1.8} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>Dark mode</Text>
          <Text style={styles.rowNote}>Your choice is saved on this device</Text>
        </View>
        <Switch
          value={colorScheme === "dark"}
          onValueChange={toggleColorScheme}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </Card>

      <Card style={styles.row}>
        <Globe size={18} color={colors.muted} strokeWidth={1.8} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>Language</Text>
          <Text style={styles.rowNote}>English (more languages coming soon)</Text>
        </View>
      </Card>

      <Pressable onPress={() => router.push("/design-system")} accessibilityRole="button">
        <Card style={styles.row}>
          <Palette size={18} color={colors.muted} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Design system</Text>
            <Text style={styles.rowNote}>Colors, type, and components reference</Text>
          </View>
          <ChevronRight size={16} color={colors.muted} />
        </Card>
      </Pressable>

      <Button
        label="Sign out"
        variant="destructive"
        icon={<LogOut size={16} color={colors.error} />}
        onPress={() => void signOut()}
      />
    </ScrollView>
  );
}
