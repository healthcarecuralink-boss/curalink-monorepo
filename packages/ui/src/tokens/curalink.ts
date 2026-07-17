// CuraLink (consumer) — "Caring Warmth" design tokens.
// Sourced from design_handoff_curalink/README.md and reference-docs/
// CuraLink-original-design-spec.md section 4.1-4.3.

export const curalinkColors = {
  light: {
    primary: "#00C27C",
    primaryStrong: "#00CE86",
    primaryPress: "#057A4E",
    navy: "#0B1D2E",
    navy2: "#142A3E",
    navySoft: "#1D3A52",
    bg: "#FAFAF8",
    surface: "#FFFFFF",
    ink: "#0A1B2A",
    ink2: "#334A5E",
    muted: "#51677C",
    muted2: "#6B7E90",
    faint: "#98A6B4",
    faint2: "#B7C2CD",
    border: "#E3E7EA",
    border2: "#E8ECEF",
    divider: "#EEF0F2",
    track: "#EDEFF1",
    chipNeutral: "#EEF2F6",
    success: "#0E9F6E",
    successTint: "#E6F7EF",
    warning: "#B45309",
    warningTint: "#FCF1E1",
    error: "#C81E1E",
    errorStrong: "#B01717",
    errorCta: "#D64545",
    errorTint: "#FCEAEA",
    info: "#1D6FB8",
    infoTint: "#E7F1FB",
    star: "#E8A33D",
  },
  // "warm-charcoal navy background, brightened green & sage accents"
  // (original design spec 4.1). Semantic/tint colors aren't separately
  // spec'd for dark mode, so they're reused from light as a reasonable
  // default until a dedicated dark palette is designed.
  dark: {
    primary: "#00E392",
    primaryStrong: "#00E392",
    primaryPress: "#00C27C",
    navy: "#0B1D2E",
    navy2: "#142A3E",
    navySoft: "#1D3A52",
    bg: "#0B1D2E",
    surface: "#142A3E",
    ink: "#F5EEE5",
    ink2: "#EFF2F4",
    muted: "#B7C2CD",
    muted2: "#98A6B4",
    faint: "#7E8FA0",
    faint2: "#5B6B7F",
    border: "#1D3A52",
    border2: "#24425C",
    divider: "#1D3A52",
    track: "#1D3A52",
    chipNeutral: "#1D3A52",
    success: "#0E9F6E",
    successTint: "#123B2E",
    warning: "#E8A33D",
    warningTint: "#3A2A12",
    error: "#E8605F",
    errorStrong: "#B01717",
    errorCta: "#D64545",
    errorTint: "#3A1616",
    info: "#4FA3E8",
    infoTint: "#122E44",
    star: "#E8A33D",
  },
} as const;

// Category accent colors (icon chips / avatars). Vet's tint background
// isn't spec'd explicitly (only the foreground copper hex is given) --
// derived here as a light tint of the same hue for consistency with the
// other categories.
export const curalinkCategoryAccents = {
  nurse: { fg: "#057A4E", bg: "#E9FBF3" },
  doctor: { fg: "#142A3E", bg: "#EEF2F6" },
  physio: { fg: "#B45309", bg: "#FCF1E1" },
  vet: { fg: "#B87333", bg: "#F5E9DC" },
  pediatric: { fg: "#6D5FA3", bg: "#EAE7F2" },
  lab: { fg: "#0B1D2E", bg: "#EEF2F6" },
} as const;

// Status pill colors -- bespoke fg/bg pairs from the prototype's design
// system screen, not derived from the general semantic tokens above.
export const curalinkStatusPillColors = {
  pending: { fg: "#B45309", bg: "#F7EEDD" },
  confirmed: { fg: "#0B1D2E", bg: "#E9FBF3" },
  enRoute: { fg: "#057A4E", bg: "#E9FBF3" },
  inProgress: { fg: "#0B1D2E", bg: "#E9FBF3" },
  completed: { fg: "#0E9F6E", bg: "#E6F7EF" },
  cancelled: { fg: "#9A8B7E", bg: "#F1EAE2" },
} as const;

export const curalinkRadius = {
  card: 18,
  cardLarge: 20,
  button: 13,
  chip: 14,
  pill: 999,
  sheet: 28,
} as const;

export const curalinkShadows = {
  card: {
    shadowColor: "#0B1D2E",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ctaPrimary: {
    shadowColor: "#00C27C",
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  navyDark: {
    shadowColor: "#0B1D2E",
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  destructive: {
    shadowColor: "#D64545",
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

// fontFamily names match what useFonts() from @expo-google-fonts/* registers.
export const curalinkFonts = {
  display: "BricolageGrotesque_800ExtraBold",
  heading: "BricolageGrotesque_800ExtraBold",
  headingSemibold: "BricolageGrotesque_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
} as const;

export const curalinkType = {
  display: { fontFamily: curalinkFonts.display, fontSize: 36, letterSpacing: -0.75 },
  h1: { fontFamily: curalinkFonts.heading, fontSize: 25, letterSpacing: -0.4 },
  h2: { fontFamily: curalinkFonts.heading, fontSize: 20, letterSpacing: -0.2 },
  h3: { fontFamily: curalinkFonts.headingSemibold, fontSize: 16 },
  bodyLarge: { fontFamily: curalinkFonts.body, fontSize: 16 },
  body: { fontFamily: curalinkFonts.body, fontSize: 14 },
  bodySmall: { fontFamily: curalinkFonts.body, fontSize: 12.5 },
  caption: { fontFamily: curalinkFonts.bodyMedium, fontSize: 11 },
  eyebrow: {
    fontFamily: curalinkFonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
} as const;

export type CuralinkColorScheme = keyof typeof curalinkColors;
