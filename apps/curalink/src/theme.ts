import { createThemeProvider, curalinkColors, curalinkRadius, curalinkType } from "@curalink/ui";

export const ThemeProvider = createThemeProvider({
  colors: curalinkColors,
  radius: curalinkRadius,
  type: curalinkType,
});
