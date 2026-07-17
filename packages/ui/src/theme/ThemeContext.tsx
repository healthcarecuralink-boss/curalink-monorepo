import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TextStyle } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "@curalink/color-scheme";

// Rules that apply identically across both apps (README: "Both apps: 8pt
// spacing scale, minimum text size ~10.5px (captions only), minimum tap
// target 44px").
export interface CommonThemeColors {
  primary: string;
  primaryStrong: string;
  primaryPress: string;
  ink: string;
  ink2: string;
  surface: string;
  bg: string;
  border: string;
  muted: string;
  error: string;
}

export interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: CommonThemeColors & Record<string, string>;
  radius: Record<string, number>;
  type: Record<string, TextStyle & { fontSize: number }>;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeDefinition {
  colors: { light: CommonThemeColors & Record<string, string>; dark: CommonThemeColors & Record<string, string> };
  radius: Record<string, number>;
  type: Record<string, TextStyle & { fontSize: number }>;
}

// Each app calls this once with its own token set to get a ThemeProvider
// scoped to its own design language. The chosen scheme persists across app
// restarts via AsyncStorage -- both apps share one storage key name, which
// is fine since each app's AsyncStorage (native) / localStorage (web) is
// already sandboxed per-app / per-origin.
export function createThemeProvider(theme: ThemeDefinition) {
  return function ThemeProvider({
    children,
    initialColorScheme = "light",
  }: {
    children: ReactNode;
    initialColorScheme?: ColorScheme;
  }) {
    const [colorScheme, setColorSchemeState] = useState<ColorScheme>(initialColorScheme);

    useEffect(() => {
      void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
        if (saved === "light" || saved === "dark") {
          setColorSchemeState(saved);
        }
      });
    }, []);

    function setColorScheme(scheme: ColorScheme) {
      setColorSchemeState(scheme);
      void AsyncStorage.setItem(STORAGE_KEY, scheme);
    }

    const value = useMemo<ThemeContextValue>(
      () => ({
        colorScheme,
        colors: theme.colors[colorScheme],
        radius: theme.radius,
        type: theme.type,
        toggleColorScheme: () => setColorScheme(colorScheme === "light" ? "dark" : "light"),
        setColorScheme,
      }),
      [colorScheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  };
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() must be called within a ThemeProvider (see @curalink/ui)");
  }
  return ctx;
}
