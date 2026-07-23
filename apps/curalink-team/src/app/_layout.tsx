import { useEffect, useRef, useState } from "react";
import { router, Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initSessionListener, useSessionStore } from "@curalink/api-client";
import { ThemeProvider } from "../theme";

export default function RootLayout() {
  useEffect(() => initSessionListener(), []);
  const [queryClient] = useState(() => new QueryClient());
  const session = useSessionStore((s) => s.session);
  const isLoading = useSessionStore((s) => s.isLoading);

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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
