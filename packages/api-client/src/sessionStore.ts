import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { fetchProfile } from "./auth";
import { authStorageAdapter } from "./storageAdapter";
import { isProfessionalRole } from "./types";
import type { Profile, ProfessionalRole } from "./types";

const ACTIVE_ROLE_STORAGE_KEY = "curalink.activeRole";

interface SessionState {
  session: Session | null;
  profile: Profile | null;
  // CuraLink Plus multi-role support: which of the user's approved roles is
  // currently driving the dashboard. Switching this is a pure client-side
  // state change (README: "no fresh auth round-trip") -- it never re-hits
  // Supabase Auth, it just changes which role-scoped UI/queries are active.
  activeRole: ProfessionalRole | null;
  isLoading: boolean;
  // Google sign-in can navigate away from the screen that's actually
  // running the exchange (Expo Router jumps to auth-callback.tsx the
  // instant the bare deep link lands, before that promise settles) -- so a
  // thrown error there has nowhere local to be shown. Stashed here instead,
  // so whichever screen is on screen when it happens can display it.
  authError: string | null;
  setAuthError: (message: string | null) => void;
  setActiveRole: (role: ProfessionalRole) => void;
  refreshProfile: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  profile: null,
  activeRole: null,
  isLoading: true,
  authError: null,

  setAuthError: (message) => set({ authError: message }),

  setActiveRole: (role) => {
    set({ activeRole: role });
    void authStorageAdapter.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
  },

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;
    const profile = await fetchProfile(userId);
    set((state) => {
      const roles = profile?.roles ?? [];
      const activeStillValid = state.activeRole && roles.includes(state.activeRole);
      const firstRole = roles.find(isProfessionalRole) ?? null;
      return {
        profile,
        activeRole: activeStillValid ? state.activeRole : firstRole,
      };
    });
  },
}));

// Called once from each app's root layout. Restores any persisted active-role
// choice, hydrates the current session, and keeps both in sync with
// Supabase Auth's own state changes (sign-in, sign-out, token refresh).
export function initSessionListener(): () => void {
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    const storedRole = await authStorageAdapter.getItem(ACTIVE_ROLE_STORAGE_KEY);
    useSessionStore.setState({
      session,
      isLoading: false,
      activeRole: storedRole && isProfessionalRole(storedRole) ? storedRole : null,
    });
    if (session) await useSessionStore.getState().refreshProfile();
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    useSessionStore.setState({ session });
    if (session) {
      await useSessionStore.getState().refreshProfile();
    } else {
      useSessionStore.setState({ profile: null, activeRole: null });
      await authStorageAdapter.removeItem(ACTIVE_ROLE_STORAGE_KEY);
    }
  });

  return () => subscription.unsubscribe();
}
