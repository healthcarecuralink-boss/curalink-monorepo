// CuraLink Plus (staff/provider) — "Clinical Confidence" design tokens.
// Sourced from design_handoff_curalink/README.md and the prototype's own
// design-system screen / dark-mode variables (CuraLink Plus.dc.html).

export const curalinkPlusColors = {
  light: {
    primary: "#0F7A5E",
    primaryStrong: "#128A6B",
    primaryPress: "#0B5A45",
    amber: "#F4A23B",
    ink: "#10192B",
    ink2: "#33404F",
    surface: "#FFFFFF",
    bg: "#F7F8FA",
    border: "#E4E8EC",
    muted: "#5B6B7F",
    error: "#DC3545",
  },
  dark: {
    primary: "#0F7A5E",
    primaryStrong: "#128A6B",
    primaryPress: "#0B5A45",
    amber: "#F4A23B",
    ink: "#F5F3EF",
    ink2: "#D8DEE6",
    surface: "#131E33",
    bg: "#0A1628",
    border: "#223049",
    muted: "#94A3B8",
    error: "#DC3545",
  },
} as const;

// Per-role accent colors (README design tokens table).
export const roleAccents = {
  nurse: "#0F7A5E",
  vet: "#8B5CF6",
  doctor: "#3B82F6",
  admin: "#64748B",
  pharmacy: "#0EA5E9",
  ambulance: "#DC3545",
} as const;

export const roleTints: Record<keyof typeof roleAccents, string> = {
  nurse: "#E8F5F0",
  vet: "#F1EBFD",
  doctor: "#EAF1FE",
  admin: "#EEF1F4",
  pharmacy: "#E0F5FC",
  ambulance: "#FCE8E8",
};

// Status pill colors -- bespoke fg/bg pairs from the prototype's design
// system screen, not derived from the general tokens above.
export const curalinkPlusStatusPillColors = {
  available: { fg: "#0B5A45", bg: "#E8F5F0" },
  onBreak: { fg: "#B45309", bg: "#FEF3E2" },
  enRoute: { fg: "#1D4ED8", bg: "#EAF1FE" },
  offShift: { fg: "#64748B", bg: "#EEF1F4" },
  emergency: { fg: "#B91C1C", bg: "#FCE8E8" },
} as const;

export const curalinkPlusRadius = {
  card: 13,
  button: 11,
  chip: 11,
  pill: 999,
  // Not spec'd explicitly (README only gives the 10-16px general range) --
  // picked slightly larger for a sheet's top corners, consistent with the
  // general range's upper bound plus a touch more for a full-width sheet.
  sheet: 24,
} as const;

// "Shadows minimal -- hairline borders carry most elevation" (README).
export const curalinkPlusShadows = {
  card: {
    shadowColor: "#10192B",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;

export const curalinkPlusFonts = {
  display: "PlusJakartaSans_800ExtraBold",
  heading: "PlusJakartaSans_800ExtraBold",
  headingSemibold: "PlusJakartaSans_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
} as const;

export const curalinkPlusType = {
  display: { fontFamily: curalinkPlusFonts.display, fontSize: 28, letterSpacing: -0.3 },
  h1: { fontFamily: curalinkPlusFonts.heading, fontSize: 22 },
  h2: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 18 },
  body: { fontFamily: curalinkPlusFonts.body, fontSize: 14 },
  bodySmall: { fontFamily: curalinkPlusFonts.body, fontSize: 12.5 },
  caption: {
    fontFamily: curalinkPlusFonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
  },
} as const;

export type CuralinkPlusColorScheme = keyof typeof curalinkPlusColors;
export type ProfessionalRoleKey = keyof typeof roleAccents;
