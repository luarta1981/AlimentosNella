import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { NellaColors, NellaFonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Títulos principales: 32px
  title: {
    fontFamily: NellaFonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: NellaColors.red,
  },
  // Subtítulos: 20px
  subtitle: {
    fontFamily: NellaFonts.display,
    fontSize: 20,
    lineHeight: 28,
    color: NellaColors.subtitleGray,
  },
  // Body / textos secundarios: 16px
  default: {
    fontFamily: NellaFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: NellaColors.bodyGray,
  },
  small: {
    fontFamily: NellaFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: NellaColors.bodyGray,
  },
  smallBold: {
    fontFamily: NellaFonts.display,
    fontSize: 16,
    lineHeight: 24,
    color: NellaColors.subtitleGray,
  },
  link: {
    fontFamily: NellaFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: NellaColors.bodyGray,
    textDecorationLine: 'underline',
  },
  linkPrimary: {
    fontFamily: NellaFonts.display,
    fontSize: 16,
    lineHeight: 24,
    color: NellaColors.red,
  },
  code: {
    fontFamily: Platform.select({
      ios: 'ui-monospace',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
