import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { Sentry } from "../utils/sentry";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initSessionListener, useSessionStore } from "@curalink/api-client";
import {
  useFonts,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { ThemeProvider } from "../theme";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";

SplashScreen.preventAutoHideAsync();

// Foreground behavior -- no-op on web (guarded inside registerForPushNotificationsAsync).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootLayout() {
  useEffect(() => initSessionListener(), []);
  const [queryClient] = useState(() => new QueryClient());
  const session = useSessionStore((s) => s.session);

  useEffect(() => {
    if (session?.user.id) {
      void registerForPushNotificationsAsync(session.user.id);
    }
  }, [session?.user.id]);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
