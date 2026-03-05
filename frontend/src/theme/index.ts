import { createTheme, ThemeOptions } from '@mui/material/styles';
import { defaultLightTokens, defaultDarkTokens, type DesignTokens } from './tokens';

/**
 * Convert design tokens to Material-UI theme options
 * Maps our custom design token structure to Material-UI's theme format
 * 
 * @param tokens - Design tokens to convert
 * @param mode - Theme mode ('light' or 'dark')
 * @returns Material-UI theme options
 */
function createThemeOptionsFromTokens(tokens: DesignTokens, mode: 'light' | 'dark'): ThemeOptions {
  const { colors, typography, spacing, shadows, borderRadius } = tokens;

  return {
    breakpoints: {
      values: {
        xs: 320,   // Mobile portrait
        sm: 768,   // Tablet portrait
        md: 1024,  // Tablet landscape / Small desktop
        lg: 1440,  // Desktop
        xl: 1920,  // Large desktop
      },
    },
    palette: {
      mode,
      primary: {
        main: colors.primary[500],
        light: colors.primary[300],
        dark: colors.primary[700],
        contrastText: mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : '#fff',
      },
      secondary: {
        main: colors.secondary[500],
        light: colors.secondary[300],
        dark: colors.secondary[700],
        contrastText: mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : '#fff',
      },
      success: {
        main: colors.success[500],
        light: colors.success[300],
        dark: colors.success[700],
        contrastText: '#fff',
      },
      error: {
        main: colors.error[500],
        light: colors.error[300],
        dark: colors.error[700],
        contrastText: '#fff',
      },
      warning: {
        main: colors.warning[500],
        light: colors.warning[300],
        dark: colors.warning[700],
        contrastText: 'rgba(0, 0, 0, 0.87)',
      },
      info: {
        main: colors.info[500],
        light: colors.info[300],
        dark: colors.info[700],
        contrastText: '#fff',
      },
      background: {
        default: colors.background.default,
        paper: colors.background.paper,
      },
      text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
        disabled: colors.text.disabled,
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    typography: {
      fontFamily: typography.fontFamily.primary,
      fontSize: parseFloat(typography.fontSize.base) * 16, // Convert rem to px (base 16px)
      fontWeightLight: 300,
      fontWeightRegular: typography.fontWeight.normal,
      fontWeightMedium: typography.fontWeight.medium,
      fontWeightBold: typography.fontWeight.bold,
      h1: {
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
      },
      h2: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
      },
      h3: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.tight,
      },
      h4: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
      },
      h5: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
      },
      h6: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
      },
      body1: {
        fontSize: typography.fontSize.base,
        lineHeight: typography.lineHeight.normal,
      },
      body2: {
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.normal,
      },
      button: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        textTransform: 'none',
      },
      caption: {
        fontSize: typography.fontSize.xs,
        lineHeight: typography.lineHeight.normal,
      },
      overline: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
        textTransform: 'uppercase',
      },
    },
    spacing: (factor: number) => {
      // Material-UI spacing function: spacing(1) = 8px by default
      // We map our spacing tokens to this system
      const baseSpacing = parseFloat(spacing.sm) * 16; // 0.5rem = 8px
      return `${baseSpacing * factor}px`;
    },
    shape: {
      borderRadius: parseFloat(borderRadius.md) * 16, // Convert rem to px
    },
    shadows: [
      'none',
      shadows.sm,
      shadows.sm,
      shadows.md,
      shadows.md,
      shadows.md,
      shadows.md,
      shadows.lg,
      shadows.lg,
      shadows.lg,
      shadows.lg,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
    ],
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: shadows.md,
            borderRadius: borderRadius.md,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: typography.fontWeight.medium,
            borderRadius: borderRadius.sm,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none', // Remove default gradient in dark mode
          },
          elevation1: {
            boxShadow: shadows.sm,
          },
          elevation2: {
            boxShadow: shadows.md,
          },
          elevation3: {
            boxShadow: shadows.lg,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: shadows.sm,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.full,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius.sm,
            },
          },
        },
      },
    },
  };
}

/**
 * Create Material-UI theme from design tokens
 * 
 * @param tokens - Design tokens to use
 * @param mode - Theme mode ('light' or 'dark')
 * @returns Material-UI theme object
 */
export function createThemeFromTokens(tokens: DesignTokens, mode: 'light' | 'dark') {
  const options = createThemeOptionsFromTokens(tokens, mode);
  return createTheme(options);
}

/**
 * Default light theme created from default light tokens
 */
export const lightTheme = createThemeFromTokens(defaultLightTokens, 'light');

/**
 * Default dark theme created from default dark tokens
 */
export const darkTheme = createThemeFromTokens(defaultDarkTokens, 'dark');

// Export theme utilities
export { ThemeParser } from './parser';
export { ThemeSerializer } from './serializer';
export { ThemeEngine } from './engine';
export type { ThemeParseResult } from './parser';
export type { FormatOptions } from './serializer';
export type { ThemeMode } from './engine';

// Export theme tokens and types
export {
  defaultThemeConfig,
  defaultLightTokens,
  defaultDarkTokens,
} from './tokens';
export type {
  ThemeConfig,
  DesignTokens,
  ColorTokens,
  ColorScale,
  BackgroundColors,
  TextColors,
  TypographyTokens,
  SpacingTokens,
  ShadowTokens,
  BorderRadiusTokens,
} from './tokens';
