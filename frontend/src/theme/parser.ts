/**
 * Theme Parser for KodaAI AIDLC Management System
 * 
 * This module provides functionality to parse and validate theme configuration JSON.
 * It ensures all required design tokens are present and returns descriptive error
 * messages with JSON paths for invalid configurations.
 */

import type {
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

/**
 * Result of theme parsing operation
 */
export interface ThemeParseResult {
  success: boolean;
  theme?: ThemeConfig;
  errors?: string[];
}

/**
 * ThemeParser class for parsing and validating theme configurations
 */
export class ThemeParser {
  /**
   * Parse a JSON string into a ThemeConfig object
   * 
   * @param json - JSON string containing theme configuration
   * @returns ThemeParseResult with success status, parsed theme, or errors
   */
  parse(json: string): ThemeParseResult {
    // Step 1: Parse JSON syntax
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (error) {
      return {
        success: false,
        errors: [
          `Invalid JSON syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }

    // Step 2: Validate the parsed object
    const errors = this.getValidationErrors(parsed);
    
    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    // Step 3: Return successfully parsed theme
    return {
      success: true,
      theme: parsed as ThemeConfig,
    };
  }

  /**
   * Validate a theme configuration object
   * 
   * @param config - Object to validate as ThemeConfig
   * @returns true if valid, false otherwise
   */
  validate(config: unknown): boolean {
    return this.getValidationErrors(config).length === 0;
  }

  /**
   * Get detailed validation errors for a theme configuration
   * 
   * @param config - Object to validate
   * @returns Array of error messages with JSON paths
   */
  getValidationErrors(config: unknown): string[] {
    const errors: string[] = [];

    // Check if config is an object
    if (!config || typeof config !== 'object') {
      errors.push('Theme configuration must be an object');
      return errors;
    }

    const theme = config as Record<string, unknown>;

    // Validate required top-level fields
    if (!theme.version || typeof theme.version !== 'string') {
      errors.push('$.version: Required field missing or invalid (expected string)');
    }

    if (!theme.name || typeof theme.name !== 'string') {
      errors.push('$.name: Required field missing or invalid (expected string)');
    }

    // Validate light mode tokens
    if (!theme.light) {
      errors.push('$.light: Required field missing');
    } else {
      errors.push(...this.validateDesignTokens(theme.light, '$.light'));
    }

    // Validate dark mode tokens
    if (!theme.dark) {
      errors.push('$.dark: Required field missing');
    } else {
      errors.push(...this.validateDesignTokens(theme.dark, '$.dark'));
    }

    return errors;
  }

  /**
   * Validate a DesignTokens object
   * 
   * @param tokens - Object to validate
   * @param path - JSON path for error reporting
   * @returns Array of error messages
   */
  private validateDesignTokens(tokens: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!tokens || typeof tokens !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const designTokens = tokens as Record<string, unknown>;

    // Validate colors
    if (!designTokens.colors) {
      errors.push(`${path}.colors: Required field missing`);
    } else {
      errors.push(...this.validateColorTokens(designTokens.colors, `${path}.colors`));
    }

    // Validate typography
    if (!designTokens.typography) {
      errors.push(`${path}.typography: Required field missing`);
    } else {
      errors.push(...this.validateTypographyTokens(designTokens.typography, `${path}.typography`));
    }

    // Validate spacing
    if (!designTokens.spacing) {
      errors.push(`${path}.spacing: Required field missing`);
    } else {
      errors.push(...this.validateSpacingTokens(designTokens.spacing, `${path}.spacing`));
    }

    // Validate shadows
    if (!designTokens.shadows) {
      errors.push(`${path}.shadows: Required field missing`);
    } else {
      errors.push(...this.validateShadowTokens(designTokens.shadows, `${path}.shadows`));
    }

    // Validate borderRadius
    if (!designTokens.borderRadius) {
      errors.push(`${path}.borderRadius: Required field missing`);
    } else {
      errors.push(...this.validateBorderRadiusTokens(designTokens.borderRadius, `${path}.borderRadius`));
    }

    return errors;
  }

  /**
   * Validate ColorTokens object
   */
  private validateColorTokens(colors: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!colors || typeof colors !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const colorTokens = colors as Record<string, unknown>;

    // Validate color scales
    const colorScales = ['primary', 'secondary', 'success', 'error', 'warning', 'info', 'neutral'];
    for (const scale of colorScales) {
      if (!colorTokens[scale]) {
        errors.push(`${path}.${scale}: Required color scale missing`);
      } else {
        errors.push(...this.validateColorScale(colorTokens[scale], `${path}.${scale}`));
      }
    }

    // Validate background colors
    if (!colorTokens.background) {
      errors.push(`${path}.background: Required field missing`);
    } else {
      errors.push(...this.validateBackgroundColors(colorTokens.background, `${path}.background`));
    }

    // Validate text colors
    if (!colorTokens.text) {
      errors.push(`${path}.text: Required field missing`);
    } else {
      errors.push(...this.validateTextColors(colorTokens.text, `${path}.text`));
    }

    return errors;
  }

  /**
   * Validate ColorScale object
   */
  private validateColorScale(scale: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!scale || typeof scale !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const colorScale = scale as Record<string, unknown>;
    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

    for (const shade of shades) {
      if (!colorScale[shade]) {
        errors.push(`${path}.${shade}: Required shade missing`);
      } else if (typeof colorScale[shade] !== 'string') {
        errors.push(`${path}.${shade}: Must be a string (color value)`);
      } else if (!this.isValidColor(colorScale[shade] as string)) {
        errors.push(`${path}.${shade}: Invalid color format (expected hex, rgb, or rgba)`);
      }
    }

    return errors;
  }

  /**
   * Validate BackgroundColors object
   */
  private validateBackgroundColors(bg: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!bg || typeof bg !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const background = bg as Record<string, unknown>;
    const required = ['default', 'paper', 'elevated'];

    for (const field of required) {
      if (!background[field]) {
        errors.push(`${path}.${field}: Required field missing`);
      } else if (typeof background[field] !== 'string') {
        errors.push(`${path}.${field}: Must be a string (color value)`);
      } else if (!this.isValidColor(background[field] as string)) {
        errors.push(`${path}.${field}: Invalid color format (expected hex, rgb, or rgba)`);
      }
    }

    return errors;
  }

  /**
   * Validate TextColors object
   */
  private validateTextColors(text: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!text || typeof text !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const textColors = text as Record<string, unknown>;
    const required = ['primary', 'secondary', 'disabled'];

    for (const field of required) {
      if (!textColors[field]) {
        errors.push(`${path}.${field}: Required field missing`);
      } else if (typeof textColors[field] !== 'string') {
        errors.push(`${path}.${field}: Must be a string (color value)`);
      } else if (!this.isValidColor(textColors[field] as string)) {
        errors.push(`${path}.${field}: Invalid color format (expected hex, rgb, or rgba)`);
      }
    }

    return errors;
  }

  /**
   * Validate TypographyTokens object
   */
  private validateTypographyTokens(typography: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!typography || typeof typography !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const typo = typography as Record<string, unknown>;

    // Validate fontFamily
    if (!typo.fontFamily) {
      errors.push(`${path}.fontFamily: Required field missing`);
    } else if (typeof typo.fontFamily !== 'object' || !typo.fontFamily) {
      errors.push(`${path}.fontFamily: Must be an object`);
    } else {
      const fontFamily = typo.fontFamily as Record<string, unknown>;
      if (!fontFamily.primary || typeof fontFamily.primary !== 'string') {
        errors.push(`${path}.fontFamily.primary: Required field missing or invalid (expected string)`);
      }
      if (!fontFamily.monospace || typeof fontFamily.monospace !== 'string') {
        errors.push(`${path}.fontFamily.monospace: Required field missing or invalid (expected string)`);
      }
    }

    // Validate fontSize
    if (!typo.fontSize) {
      errors.push(`${path}.fontSize: Required field missing`);
    } else if (typeof typo.fontSize !== 'object' || !typo.fontSize) {
      errors.push(`${path}.fontSize: Must be an object`);
    } else {
      const fontSize = typo.fontSize as Record<string, unknown>;
      const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'];
      for (const size of sizes) {
        if (!fontSize[size] || typeof fontSize[size] !== 'string') {
          errors.push(`${path}.fontSize.${size}: Required field missing or invalid (expected string)`);
        }
      }
    }

    // Validate fontWeight
    if (!typo.fontWeight) {
      errors.push(`${path}.fontWeight: Required field missing`);
    } else if (typeof typo.fontWeight !== 'object' || !typo.fontWeight) {
      errors.push(`${path}.fontWeight: Must be an object`);
    } else {
      const fontWeight = typo.fontWeight as Record<string, unknown>;
      const weights = ['normal', 'medium', 'semibold', 'bold'];
      for (const weight of weights) {
        if (typeof fontWeight[weight] !== 'number') {
          errors.push(`${path}.fontWeight.${weight}: Required field missing or invalid (expected number)`);
        }
      }
    }

    // Validate lineHeight
    if (!typo.lineHeight) {
      errors.push(`${path}.lineHeight: Required field missing`);
    } else if (typeof typo.lineHeight !== 'object' || !typo.lineHeight) {
      errors.push(`${path}.lineHeight: Must be an object`);
    } else {
      const lineHeight = typo.lineHeight as Record<string, unknown>;
      const heights = ['tight', 'normal', 'relaxed'];
      for (const height of heights) {
        if (typeof lineHeight[height] !== 'number') {
          errors.push(`${path}.lineHeight.${height}: Required field missing or invalid (expected number)`);
        }
      }
    }

    return errors;
  }

  /**
   * Validate SpacingTokens object
   */
  private validateSpacingTokens(spacing: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!spacing || typeof spacing !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const spacingTokens = spacing as Record<string, unknown>;
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

    for (const size of sizes) {
      if (!spacingTokens[size] || typeof spacingTokens[size] !== 'string') {
        errors.push(`${path}.${size}: Required field missing or invalid (expected string)`);
      }
    }

    return errors;
  }

  /**
   * Validate ShadowTokens object
   */
  private validateShadowTokens(shadows: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!shadows || typeof shadows !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const shadowTokens = shadows as Record<string, unknown>;
    const sizes = ['sm', 'md', 'lg', 'xl'];

    for (const size of sizes) {
      if (!shadowTokens[size] || typeof shadowTokens[size] !== 'string') {
        errors.push(`${path}.${size}: Required field missing or invalid (expected string)`);
      }
    }

    return errors;
  }

  /**
   * Validate BorderRadiusTokens object
   */
  private validateBorderRadiusTokens(borderRadius: unknown, path: string): string[] {
    const errors: string[] = [];

    if (!borderRadius || typeof borderRadius !== 'object') {
      errors.push(`${path}: Must be an object`);
      return errors;
    }

    const radiusTokens = borderRadius as Record<string, unknown>;
    const sizes = ['sm', 'md', 'lg', 'full'];

    for (const size of sizes) {
      if (!radiusTokens[size] || typeof radiusTokens[size] !== 'string') {
        errors.push(`${path}.${size}: Required field missing or invalid (expected string)`);
      }
    }

    return errors;
  }

  /**
   * Check if a string is a valid color format
   * Supports hex (#RGB, #RRGGBB, #RRGGBBAA), rgb(), and rgba()
   */
  private isValidColor(color: string): boolean {
    // Hex color: #RGB, #RRGGBB, #RRGGBBAA
    const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
    if (hexPattern.test(color)) {
      return true;
    }

    // RGB color: rgb(r, g, b)
    const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    if (rgbPattern.test(color)) {
      return true;
    }

    // RGBA color: rgba(r, g, b, a)
    const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
    if (rgbaPattern.test(color)) {
      return true;
    }

    return false;
  }
}
