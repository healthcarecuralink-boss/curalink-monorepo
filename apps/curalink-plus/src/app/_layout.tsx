import { useEffect, useRef, useState } from "react";
import { router, Stack } from "expo-router";
import { wrapRootLayout } from "../utils/sentry";
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
  const isLoading = useSessionStore((s) => s.isLoading);

  // Root-level, so it fires no matter which screen is on top when sign-out
  // happens (settings.tsx, profile.tsx, ...) -- without this, the session
  // clears but nothing navigates away from whatever now-unauthenticated
  // screen the user was on. Only reacts to an actual logged-in -> logged-out
  // transition (hadSession ref), so it doesn't fire during the initial
  // session check on cold start.
  const hadSession = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (session) {
      hadSession.current = true;
      return;
    }
    if (hadSession.current) {
      hadSession.current = false;
      router.replace("/login");
    }
  }, [session, isLoading]);

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

export default wrapRootLayout(RootLayout);
