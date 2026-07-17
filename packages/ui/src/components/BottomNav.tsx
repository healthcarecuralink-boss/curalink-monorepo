import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export interface BottomNavTab {
  key: string;
  label: string;
  icon: ReactNode;
  activeIcon?: ReactNode;
  isActive: boolean;
  onPress: () => void;
}

export interface BottomNavProps {
  tabs: BottomNavTab[];
  // CuraLink's raised center FAB ("Book"). CuraLink Plus's nav is 5 plain
  // tabs with no center FAB, so this is optional.
  centerFab?: { icon: ReactNode; onPress: () => void };
}

export function BottomNav({ tabs, centerFab }: BottomNavProps) {
  const { colors } = useTheme();

  const slots: ReactNode[] = tabs.map((tab) => (
    <Pressable key={tab.key} onPress={tab.onPress} style={styles.tab} accessibilityRole="tab">
      {tab.isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
      <Text style={[styles.label, { color: tab.isActive ? colors.primary : colors.muted, fontWeight: tab.isActive ? "700" : "500" }]}>
        {tab.label}
      </Text>
    </Pressable>
  ));

  if (centerFab) {
    slots.splice(
      Math.ceil(tabs.length / 2),
      0,
      <View key="fab-slot" style={styles.tab}>
        <FAB icon={centerFab.icon} onPress={centerFab.onPress} raised />
      </View>,
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {slots}
    </View>
  );
}

export function FAB({ icon, onPress, raised }: { icon: ReactNode; onPress: () => void; raised?: boolean }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.fab,
        { backgroundColor: colors.primary },
        raised && styles.fabRaised,
        raised && { shadowColor: colors.primary },
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 88,
    paddingTop: 9,
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  label: {
    fontSize: 10,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  fabRaised: {
    marginTop: -22,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
