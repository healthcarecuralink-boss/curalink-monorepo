import { useEffect, useRef, useState } from "react";
import { router, Stack } from "expo-router";
import * as Linking from "expo-linking";
import { wrapRootLayout } from "../utils/sentry";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSessionFromUrl, getErrorMessage, initSessionListener, useSessionStore } from "@curalink/api-client";
import {
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { ThemeProvider } from "../theme";
import { BiometricGate } from "../components/BiometricGate";
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
  // transition (hadSession ref), so it doesn't fight with index.tsx's own
  // cold-start redirect while the initial session check is still loading.
  const hadSession = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (session) {
      hadSession.current = true;
      return;
    }
    if (hadSession.current) {
      hadSession.current = false;
      router.replace("/auth");
    }
  }, [session, isLoading]);

  // Google sign-in redirect handling, root-level and independent of any
  // screen's own mount timing or Expo Router's own routing behavior for the
  // curalink://auth-callback deep link -- see createSessionFromUrl's
  // comment for why this had to move here. Covers both a cold start (app
  // wasn't running yet when the redirect arrived) and a warm one.
  useEffect(() => {
    function handleUrl(url: string) {
      void createSessionFromUrl(url).catch((err) => useSessionStore.getState().setAuthError(getErrorMessage(err)));
    }
    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      void registerForPushNotificationsAsync(session.user.id);
    }
  }, [session?.user.id]);

  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
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
        <BiometricGate>
          <Stack screenOptions={{ headerShown: false }} />
        </BiometricGate>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default wrapRootLayout(RootLayout);
