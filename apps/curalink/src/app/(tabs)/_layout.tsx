import { Slot, router, usePathname } from "expo-router";
import { Calendar, Home, Plus, User, Wallet } from "lucide-react-native";
import { View } from "react-native";
import { BottomNav, type BottomNavTab, useTheme } from "@curalink/ui";


const destinations = [
  { key: "home", href: "/(tabs)/home", label: "Home", icon: Home },
  { key: "bookings", href: "/(tabs)/bookings", label: "Bookings", icon: Calendar },
  { key: "wallet", href: "/(tabs)/wallet", label: "Wallet", icon: Wallet },
  { key: "profile", href: "/(tabs)/profile", label: "Profile", icon: User },
] as const;

// Custom shell (not React Navigation's <Tabs>) so the nav bar can match
// packages/ui's BottomNav exactly, including the raised center "Book" FAB.
// Root tabs clear the stack (README: "root tabs ... clear the stack"), so
// switching tabs always uses router.replace, never push.
export default function TabsLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();

  const tabs: BottomNavTab[] = destinations.map((dest) => {
    const isActive = pathname.startsWith(dest.href.replace("/(tabs)", ""));
    const Icon = dest.icon;
    return {
      key: dest.key,
      label: dest.label,
      isActive,
      icon: <Icon size={21} color={isActive ? colors.primary : colors.muted} strokeWidth={isActive ? 2.1 : 1.7} />,
      onPress: () => router.replace(dest.href),
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Slot />
      <BottomNav
        tabs={tabs}
        centerFab={{
          icon: <Plus size={26} color="#FFFFFF" strokeWidth={2.2} />,
          onPress: () => router.push("/(tabs)/services"),
        }}
      />
    </View>
  );
}
