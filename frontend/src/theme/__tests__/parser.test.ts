/**
 * Unit tests for ThemeParser
 */

import { describe, it, expect } from 'vitest';
import { ThemeParser } from '../parser';
import { defaultThemeConfig } from '../tokens';

describe('ThemeParser', () => {
  const parser = new ThemeParser();

  describe('parse', () => {
    it('should successfully parse valid theme JSON', () => {
      const json = JSON.stringify(defaultThemeConfig);
      const result = parser.parse(json);

      expect(result.success).toBe(true);
      expect(result.theme).toBeDefined();
      expect(result.errors).toBeUndefined();
      expect(result.theme?.name).toBe('KodaAI Default Theme');
    });

    it('should reject invalid JSON syntax', () => {
      const invalidJson = '{ invalid json }';
      const result = parser.parse(invalidJson);

      expect(result.success).toBe(false);
      expect(result.theme).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Invalid JSON syntax');
    });

    it('should reject theme missing version field', () => {
      const theme = { ...defaultThemeConfig };
      delete (theme as any).version;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.version'))).toBe(true);
    });

    it('should reject theme missing name field', () => {
      const theme = { ...defaultThemeConfig };
      delete (theme as any).name;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.name'))).toBe(true);
    });

    it('should reject theme missing light tokens', () => {
      const theme = { ...defaultThemeConfig };
      delete (theme as any).light;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.light'))).toBe(true);
    });

    it('should reject theme missing dark tokens', () => {
      const theme = { ...defaultThemeConfig };
      delete (theme as any).dark;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.dark'))).toBe(true);
    });

    it('should reject theme with missing color tokens', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.colors.primary;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.light.colors.primary'))).toBe(true);
    });

    it('should reject theme with invalid color format', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      theme.light.colors.primary['500'] = 'not-a-color';
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('Invalid color format'))).toBe(true);
    });

    it('should reject theme with missing color scale shade', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.colors.primary['500'];
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.light.colors.primary.500'))).toBe(true);
    });

    it('should reject theme with missing typography tokens', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.typography;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.light.typography'))).toBe(true);
    });

    it('should reject theme with missing spacing tokens', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.spacing;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.light.spacing'))).toBe(true);
    });

    it('should reject theme with missing shadow tokens', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.shadows;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.light.shadows'))).toBe(true);
    });

    it('should reject theme with missing borderRadius tokens', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.borderRadius;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('$.light.borderRadius'))).toBe(true);
    });

    it('should accept valid hex colors', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      theme.light.colors.primary['500'] = '#1976d2';
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(true);
    });

    it('should accept valid rgb colors', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      theme.light.colors.primary['500'] = 'rgb(25, 118, 210)';
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(true);
    });

    it('should accept valid rgba colors', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      theme.light.colors.text.primary = 'rgba(0, 0, 0, 0.87)';
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(true);
    });

    it('should provide descriptive error messages with JSON paths', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.colors.primary;
      delete theme.dark.typography.fontSize;
      const json = JSON.stringify(theme);
      const result = parser.parse(json);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      
      // Check that errors include JSON paths
      const hasLightColorError = result.errors!.some(e => e.includes('$.light.colors.primary'));
      const hasDarkTypographyError = result.errors!.some(e => e.includes('$.dark.typography.fontSize'));
      
      expect(hasLightColorError).toBe(true);
      expect(hasDarkTypographyError).toBe(true);
    });
  });

  describe('validate', () => {
    it('should return true for valid theme config', () => {
      const isValid = parser.validate(defaultThemeConfig);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid theme config', () => {
      const invalidTheme = { version: '1.0' }; // Missing required fields
      const isValid = parser.validate(invalidTheme);
      expect(isValid).toBe(false);
    });

    it('should return false for non-object input', () => {
      expect(parser.validate(null)).toBe(false);
      expect(parser.validate(undefined)).toBe(false);
      expect(parser.validate('string')).toBe(false);
      expect(parser.validate(123)).toBe(false);
    });
  });

  describe('getValidationErrors', () => {
    it('should return empty array for valid theme', () => {
      const errors = parser.getValidationErrors(defaultThemeConfig);
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid theme', () => {
      const invalidTheme = { version: '1.0' };
      const errors = parser.getValidationErrors(invalidTheme);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should return error for non-object input', () => {
      const errors = parser.getValidationErrors(null);
      expect(errors).toEqual(['Theme configuration must be an object']);
    });

    it('should validate all color scales', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.colors.secondary;
      delete theme.light.colors.success;
      delete theme.light.colors.error;
      
      const errors = parser.getValidationErrors(theme);
      
      expect(errors.some(e => e.includes('secondary'))).toBe(true);
      expect(errors.some(e => e.includes('success'))).toBe(true);
      expect(errors.some(e => e.includes('error'))).toBe(true);
    });

    it('should validate background colors', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.colors.background.default;
      delete theme.light.colors.background.paper;
      
      const errors = parser.getValidationErrors(theme);
      
      expect(errors.some(e => e.includes('background.default'))).toBe(true);
      expect(errors.some(e => e.includes('background.paper'))).toBe(true);
    });

    it('should validate text colors', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.colors.text.primary;
      delete theme.light.colors.text.secondary;
      
      const errors = parser.getValidationErrors(theme);
      
      expect(errors.some(e => e.includes('text.primary'))).toBe(true);
      expect(errors.some(e => e.includes('text.secondary'))).toBe(true);
    });

    it('should validate typography font families', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.typography.fontFamily.primary;
      
      const errors = parser.getValidationErrors(theme);
      
      expect(errors.some(e => e.includes('fontFamily.primary'))).toBe(true);
    });

    it('should validate typography font sizes', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.typography.fontSize.base;
      
      const errors = parser.getValidationErrors(theme);
      
      expect(errors.some(e => e.includes('fontSize.base'))).toBe(true);
    });

    it('should validate typography font weights as numbers', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      theme.light.typography.fontWeight.bold = '700'; // Should be number, not string
      
      const errors = parser.getValidationErrors(theme);
      
      expect(errors.some(e => e.includes('fontWeight.bold'))).toBe(true);
    });

    it('should validate all spacing sizes', () => {
      const theme = JSON.parse(JSON.stringify(defaultThemeConfig));
      delete theme.light.spacing.md;
      delete theme.light.spacing.lg;
      
      const errors = parser.getValidationErrors(theme);
      
      expect(errors.some(e => e.includes('spacing.md'))).toBe(true);
      expect(errors.some(e => e.includes('spacing.lg'))).toBe(true);
    });
  });
});
