// Semantic Material3 color scheme — منقول من ui/theme/Theme.kt
import React, { createContext, useContext, useMemo } from 'react';
import {
  CyanNeon,
  ElectricBlue,
  DeepViolet,
  EmeraldGlow,
  AccentPurple,
  DarkCanvas,
  DarkSurface,
  DarkSurfaceGlass,
  DarkBorder,
  DarkTextPrimary,
  DarkTextSecondary,
} from './colors';
import { typography } from './typography';

export interface MaterialColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
}

const darkColorScheme: MaterialColorScheme = {
  primary: CyanNeon,
  onPrimary: '#000000',
  primaryContainer: ElectricBlue,
  onPrimaryContainer: '#FFFFFF',
  secondary: DeepViolet,
  onSecondary: '#FFFFFF',
  secondaryContainer: AccentPurple,
  onSecondaryContainer: '#FFFFFF',
  tertiary: EmeraldGlow,
  onTertiary: '#000000',
  background: DarkCanvas,
  onBackground: DarkTextPrimary,
  surface: DarkSurface,
  onSurface: DarkTextPrimary,
  surfaceVariant: DarkSurfaceGlass,
  onSurfaceVariant: DarkTextSecondary,
  outline: DarkBorder,
};

export interface Theme {
  colors: MaterialColorScheme;
  typography: typeof typography;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({
  colors: darkColorScheme,
  typography,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // التصميم "Futuristic Glassmorphism" داكن بطبيعته (زجاج وبوابات داكنة في كل الشاشات)،
  // فنثبّت الثيم الداكن دائماً بدلاً من تبعية وضع النظام — انحراف عن Theme.kt الأصلي كذلك.
  const theme = useMemo<Theme>(
    () => ({
      colors: darkColorScheme,
      typography,
      isDark: true,
    }),
    []
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}