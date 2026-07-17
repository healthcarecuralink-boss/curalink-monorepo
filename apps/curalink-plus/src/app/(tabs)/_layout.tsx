import { Slot, router, usePathname, type Href } from "expo-router";
import {
  Briefcase,
  Calendar,
  Home,
  IndianRupee,
  Map,
  Package,
  Receipt,
  Siren,
  User,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { useSessionStore, type ProfessionalRole } from "@curalink/api-client";
import { BottomNav, type BottomNavTab, useTheme } from "@curalink/ui";


interface Destination {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

// README: tabs differ per role (Jobs/Queue/Orders/Requests/Dispatch,
// Schedule/Team, Earnings/Billing) -- everything past Home is a Step 5 stub,
// fleshed out in later steps (visit workflow, pharmacy/ambulance loops,
// admin dashboard).
const tabsByRole: Record<ProfessionalRole, Destination[]> = {
  nurse: [
    { key: "jobs", href: "/(tabs)/jobs", label: "Jobs", icon: Briefcase },
    { key: "schedule", href: "/(tabs)/schedule", label: "Schedule", icon: Calendar },
    { key: "earnings", href: "/(tabs)/earnings", label: "Earnings", icon: IndianRupee },
  ],
  vet: [
    { key: "jobs", href: "/(tabs)/jobs", label: "Jobs", icon: Briefcase },
    { key: "schedule", href: "/(tabs)/schedule", label: "Schedule", icon: Calendar },
    { key: "earnings", href: "/(tabs)/earnings", label: "Earnings", icon: IndianRupee },
  ],
  doctor: [
    { key: "queue", href: "/(tabs)/queue", label: "Queue", icon: Video },
    { key: "schedule", href: "/(tabs)/schedule", label: "Schedule", icon: Calendar },
    { key: "earnings", href: "/(tabs)/earnings", label: "Earnings", icon: IndianRupee },
  ],
  admin: [
    { key: "dispatch", href: "/(tabs)/dispatch", label: "Dispatch", icon: Map },
    { key: "team", href: "/(tabs)/team", label: "Team", icon: Users },
    { key: "billing", href: "/(tabs)/billing", label: "Billing", icon: Receipt },
  ],
  pharmacy: [
    { key: "orders", href: "/(tabs)/orders", label: "Orders", icon: Package },
    { key: "map", href: "/(tabs)/map", label: "Map", icon: Map },
    { key: "earnings", href: "/(tabs)/earnings", label: "Earnings", icon: IndianRupee },
  ],
  ambulance: [
    { key: "requests", href: "/(tabs)/requests", label: "Requests", icon: Siren },
    { key: "map", href: "/(tabs)/map", label: "Map", icon: Map },
    { key: "earnings", href: "/(tabs)/earnings", label: "Earnings", icon: IndianRupee },
  ],
};

export default function TabsLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const activeRole = useSessionStore((s) => s.activeRole);

  const destinations: Destination[] = [
    { key: "home", href: "/(tabs)/home", label: "Home", icon: Home },
    ...(activeRole ? tabsByRole[activeRole] : []),
    { key: "profile", href: "/(tabs)/profile", label: "Profile", icon: User },
  ];

  const tabs: BottomNavTab[] = destinations.map((dest) => {
    const isActive = pathname.startsWith(dest.href.replace("/(tabs)", ""));
    const Icon = dest.icon;
    return {
      key: dest.key,
      label: dest.label,
      isActive,
      icon: <Icon size={21} color={isActive ? colors.primary : colors.muted} strokeWidth={isActive ? 2.1 : 1.7} />,
      onPress: () => router.replace(dest.href as Href),
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Slot />
      <BottomNav tabs={tabs} />
    </View>
  );
}
