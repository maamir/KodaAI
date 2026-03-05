/**
 * Design Tokens for KodaAI AIDLC Management System
 * 
 * This file defines the design token schema and default token sets for light and dark modes.
 * Design tokens provide a centralized system for managing colors, typography, spacing,
 * shadows, and border radius across the application.
 */

/**
 * Color scale with 10 shades from lightest (50) to darkest (900)
 * Shade 500 is typically used as the main/primary color
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;  // main
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Background color tokens for different surface types
 */
export interface BackgroundColors {
  default: string;   // Main background color
  paper: string;     // Card/paper background
  elevated: string;  // Elevated surface (e.g., modals, popovers)
}

/**
 * Text color tokens for different text hierarchies
 */
export interface TextColors {
  primary: string;   // Primary text color
  secondary: string; // Secondary/muted text color
  disabled: string;  // Disabled text color
}

/**
 * Complete color token set
 */
export interface ColorTokens {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  error: ColorScale;
  warning: ColorScale;
  info: ColorScale;
  neutral: ColorScale;
  background: BackgroundColors;
  text: TextColors;
}

/**
 * Typography tokens for font families, sizes, weights, and line heights
 */
export interface TypographyTokens {
  fontFamily: {
    primary: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Spacing tokens for consistent margins, padding, and gaps
 */
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

/**
 * Shadow tokens for elevation and depth
 */
export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Border radius tokens for consistent rounded corners
 */
export interface BorderRadiusTokens {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

/**
 * Complete design token set for a single theme mode
 */
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borderRadius: BorderRadiusTokens;
}

/**
 * Theme configuration containing both light and dark mode token sets
 */
export interface ThemeConfig {
  version: string;      // Schema version for future compatibility
  name: string;         // Theme name
  description?: string; // Optional theme description
  author?: string;      // Optional theme author
  light: DesignTokens;  // Light mode tokens
  dark: DesignTokens;   // Dark mode tokens
}

/**
 * Default light mode color tokens
 */
const lightColors: ColorTokens = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#1976d2',
    600: '#1565c0',
    700: '#0d47a1',
    800: '#0a3d91',
    900: '#063381',
  },
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },
  success: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
  info: {
    50: '#e1f5fe',
    100: '#b3e5fc',
    200: '#81d4fa',
    300: '#4fc3f7',
    400: '#29b6f6',
    500: '#03a9f4',
    600: '#039be5',
    700: '#0288d1',
    800: '#0277bd',
    900: '#01579b',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
    elevated: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
};

/**
 * Default dark mode color tokens
 * Colors are adjusted for better visibility on dark backgrounds
 */
const darkColors: ColorTokens = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#90caf9',  // Lighter main color for dark mode
    600: '#42a5f5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#ce93d8',  // Lighter main color for dark mode
    600: '#ba68c8',
    700: '#9c27b0',
    800: '#8e24aa',
    900: '#7b1fa2',
  },
  success: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#81c784',  // Lighter main color for dark mode
    600: '#66bb6a',
    700: '#4caf50',
    800: '#43a047',
    900: '#388e3c',
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#ef5350',  // Lighter main color for dark mode
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ffb74d',  // Lighter main color for dark mode
    600: '#ffa726',
    700: '#ff9800',
    800: '#fb8c00',
    900: '#f57c00',
  },
  info: {
    50: '#e1f5fe',
    100: '#b3e5fc',
    200: '#81d4fa',
    300: '#4fc3f7',
    400: '#29b6f6',
    500: '#4fc3f7',  // Lighter main color for dark mode
    600: '#29b6f6',
    700: '#03a9f4',
    800: '#039be5',
    900: '#0288d1',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
    elevated: '#2a2a2a',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.38)',
  },
};

/**
 * Typography tokens (same for both light and dark modes)
 */
const typography: TypographyTokens = {
  fontFamily: {
    primary: '"Roboto", "Helvetica", "Arial", sans-serif',
    monospace: '"Roboto Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/**
 * Spacing tokens (same for both light and dark modes)
 */
const spacing: SpacingTokens = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
};

/**
 * Shadow tokens (same for both light and dark modes)
 */
const shadows: ShadowTokens = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

/**
 * Border radius tokens (same for both light and dark modes)
 */
const borderRadius: BorderRadiusTokens = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  full: '9999px', // Fully rounded
};

/**
 * Default light mode design tokens
 */
export const defaultLightTokens: DesignTokens = {
  colors: lightColors,
  typography,
  spacing,
  shadows,
  borderRadius,
};

/**
 * Default dark mode design tokens
 */
export const defaultDarkTokens: DesignTokens = {
  colors: darkColors,
  typography,
  spacing,
  shadows,
  borderRadius,
};

/**
 * Default theme configuration with both light and dark modes
 */
export const defaultThemeConfig: ThemeConfig = {
  version: '1.0',
  name: 'KodaAI Default Theme',
  description: 'Default theme for KodaAI AIDLC Management System',
  author: 'KodaAI Team',
  light: defaultLightTokens,
  dark: defaultDarkTokens,
};
