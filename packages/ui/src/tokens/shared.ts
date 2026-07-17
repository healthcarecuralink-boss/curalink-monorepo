// Rules that apply identically across both apps (README: "Both apps: 8pt
// spacing scale, minimum text size ~10.5px (captions only), minimum tap
// target 44px").
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const minTapTarget = 44;
export const minTextSize = 10.5;

// Feather/Lucide line icons throughout, never filled.
export const iconStrokeWidth = {
  min: 1.8,
  max: 2.4,
  default: 2,
} as const;
