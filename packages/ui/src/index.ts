export const uiPackageName = "@curalink/ui";

export { spacing, minTapTarget, minTextSize, iconStrokeWidth } from "./tokens/shared";

export {
  curalinkColors,
  curalinkCategoryAccents,
  curalinkStatusPillColors,
  curalinkRadius,
  curalinkShadows,
  curalinkFonts,
  curalinkType,
} from "./tokens/curalink";
export type { CuralinkColorScheme } from "./tokens/curalink";

export {
  curalinkPlusColors,
  roleAccents,
  roleTints,
  curalinkPlusStatusPillColors,
  curalinkPlusRadius,
  curalinkPlusShadows,
  curalinkPlusFonts,
  curalinkPlusType,
} from "./tokens/curalinkPlus";
export type { CuralinkPlusColorScheme, ProfessionalRoleKey } from "./tokens/curalinkPlus";

export { createThemeProvider, useTheme } from "./theme/ThemeContext";
export type { ColorScheme, ThemeContextValue, ThemeDefinition } from "./theme/ThemeContext";

export { Button } from "./components/Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/Button";
export { TextField } from "./components/TextField";
export type { TextFieldProps } from "./components/TextField";
export { Card } from "./components/Card";
export type { CardProps } from "./components/Card";
export { StatusPill } from "./components/StatusPill";
export type { StatusPillProps } from "./components/StatusPill";
export { Skeleton } from "./components/Skeleton";
export type { SkeletonProps } from "./components/Skeleton";
export { EmptyState } from "./components/EmptyState";
export type { EmptyStateProps } from "./components/EmptyState";
export { ErrorState } from "./components/ErrorState";
export type { ErrorStateProps } from "./components/ErrorState";
export { Toast } from "./components/Toast";
export type { ToastProps } from "./components/Toast";
export { BottomSheet } from "./components/BottomSheet";
export type { BottomSheetProps } from "./components/BottomSheet";
export { BottomNav, FAB } from "./components/BottomNav";
export type { BottomNavProps, BottomNavTab } from "./components/BottomNav";
export { LeafletMap } from "./components/LeafletMap";
export { DEFAULT_CENTER } from "./components/LeafletMap.types";
export type { LeafletMapProps, LeafletMarker } from "./components/LeafletMap.types";
