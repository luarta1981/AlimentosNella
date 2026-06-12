/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const NellaColors = {
  red: '#8B0000',
  gold: '#C8901A',
  cream: '#FBF3E2',
  creamDark: '#F0E4C8',
  titleDark: '#1C1C1E',
  subtitleGray: '#3D3D3D',
  bodyGray: '#6B6B6B',
  lightGray: '#9A9A9A',
} as const;

export const NellaFonts = {
  // Crimson Pro — títulos, nombres de productos, textos principales
  display:        'CrimsonPro_700Bold_Italic',   // títulos principales
  bold:           'CrimsonPro_700Bold',           // énfasis sin itálica
  italic:         'CrimsonPro_400Regular_Italic', // subtítulos en itálica
  regular:        'CrimsonPro_400Regular',        // body / descripciones
} as const;

export const Colors = {
  light: {
    text: NellaColors.bodyGray,
    background: '#FBF3E2',
    backgroundElement: '#EDE0C8',
    backgroundSelected: '#E5D5B0',
    textSecondary: NellaColors.lightGray,
  },
  dark: {
    text: '#E8E8E8',
    background: '#1A1008',
    backgroundElement: '#2C200E',
    backgroundSelected: '#3D2E14',
    textSecondary: '#9A9A9A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
