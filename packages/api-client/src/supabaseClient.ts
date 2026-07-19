import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { authStorageAdapter } from "./storageAdapter";
import type { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY -- set them in the app's .env file.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Without this, supabase-js defaults to the implicit flow, whose OAuth
    // redirect carries tokens in the URL *fragment* -- which never survives
    // the round-trip into a native deep link reliably. PKCE returns a
    // ?code= query param instead, which createSessionFromUrl exchanges.
    flowType: "pkce",
  },
});

// Supabase's client-side token auto-refresh timer only ticks while JS is
// running; on native it must be told when the app leaves/returns to the
// foreground or a background app can silently miss a refresh.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
