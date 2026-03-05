/**
 * Unit tests for ThemeSerializer
 */

import { describe, test, expect } from 'vitest';
import { ThemeSerializer } from '../serializer';
import { defaultThemeConfig } from '../tokens';
import type { ThemeConfig } from '../tokens';

describe('ThemeSerializer', () => {
  const serializer = new ThemeSerializer();

  describe('serialize', () => {
    test('serializes a valid theme to JSON string', () => {
      const result = serializer.serialize(defaultThemeConfig);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // Should be valid JSON
      const parsed = JSON.parse(result);
      expect(parsed).toBeDefined();
    });

    test('serialized theme can be parsed back', () => {
      const json = serializer.serialize(defaultThemeConfig);
      const parsed = JSON.parse(json) as ThemeConfig;
      
      expect(parsed.version).toBe(defaultThemeConfig.version);
      expect(parsed.name).toBe(defaultThemeConfig.name);
      expect(parsed.light).toEqual(defaultThemeConfig.light);
      expect(parsed.dark).toEqual(defaultThemeConfig.dark);
    });

    test('uses default formatting (2 space indent)', () => {
      const json = serializer.serialize(defaultThemeConfig);
      
      // Check that it's formatted with indentation
      expect(json).toContain('\n');
      expect(json).toContain('  '); // 2 spaces
    });

    test('preserves all theme properties', () => {
      const json = serializer.serialize(defaultThemeConfig);
      const parsed = JSON.parse(json) as ThemeConfig;
      
      // Check top-level properties
      expect(parsed.version).toBe(defaultThemeConfig.version);
      expect(parsed.name).toBe(defaultThemeConfig.name);
      expect(parsed.description).toBe(defaultThemeConfig.description);
      expect(parsed.author).toBe(defaultThemeConfig.author);
      
      // Check light mode tokens
      expect(parsed.light.colors.primary).toEqual(defaultThemeConfig.light.colors.primary);
      expect(parsed.light.typography).toEqual(defaultThemeConfig.light.typography);
      expect(parsed.light.spacing).toEqual(defaultThemeConfig.light.spacing);
      expect(parsed.light.shadows).toEqual(defaultThemeConfig.light.shadows);
      expect(parsed.light.borderRadius).toEqual(defaultThemeConfig.light.borderRadius);
      
      // Check dark mode tokens
      expect(parsed.dark.colors.primary).toEqual(defaultThemeConfig.dark.colors.primary);
      expect(parsed.dark.typography).toEqual(defaultThemeConfig.dark.typography);
    });
  });

  describe('format', () => {
    test('formats with default options (2 space indent, no sorting)', () => {
      const json = serializer.format(defaultThemeConfig);
      
      expect(json).toContain('\n');
      expect(json).toContain('  '); // 2 spaces
      
      // Parse to verify it's valid JSON
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    test('formats with custom indent', () => {
      const json = serializer.format(defaultThemeConfig, { indent: 4 });
      
      // Should have 4-space indentation
      expect(json).toContain('    '); // 4 spaces
      
      // Parse to verify it's valid JSON
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    test('formats with no indentation when indent is 0', () => {
      const json = serializer.format(defaultThemeConfig, { indent: 0 });
      
      // Should be compact (no newlines or spaces)
      expect(json).not.toContain('\n');
      
      // Parse to verify it's valid JSON
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    test('formats with sorted keys', () => {
      const json = serializer.format(defaultThemeConfig, { sortKeys: true });
      
      // Parse and check that keys are sorted
      const parsed = JSON.parse(json) as ThemeConfig;
      expect(parsed).toBeDefined();
      
      // Check that top-level keys appear in alphabetical order in the string
      const authorIndex = json.indexOf('"author"');
      const darkIndex = json.indexOf('"dark"');
      const descriptionIndex = json.indexOf('"description"');
      const lightIndex = json.indexOf('"light"');
      const nameIndex = json.indexOf('"name"');
      const versionIndex = json.indexOf('"version"');
      
      // Alphabetical order: author < dark < description < light < name < version
      expect(authorIndex).toBeLessThan(darkIndex);
      expect(darkIndex).toBeLessThan(descriptionIndex);
      expect(descriptionIndex).toBeLessThan(lightIndex);
      expect(lightIndex).toBeLessThan(nameIndex);
      expect(nameIndex).toBeLessThan(versionIndex);
    });

    test('formats with both custom indent and sorted keys', () => {
      const json = serializer.format(defaultThemeConfig, { 
        indent: 4, 
        sortKeys: true 
      });
      
      // Should have 4-space indentation
      expect(json).toContain('    ');
      
      // Should have sorted keys
      const authorIndex = json.indexOf('"author"');
      const darkIndex = json.indexOf('"dark"');
      expect(authorIndex).toBeLessThan(darkIndex);
      
      // Parse to verify it's valid JSON
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    test('handles minimal theme config', () => {
      const minimalTheme: ThemeConfig = {
        version: '1.0',
        name: 'Minimal Theme',
        light: defaultThemeConfig.light,
        dark: defaultThemeConfig.dark,
      };
      
      const json = serializer.format(minimalTheme);
      const parsed = JSON.parse(json) as ThemeConfig;
      
      expect(parsed.version).toBe('1.0');
      expect(parsed.name).toBe('Minimal Theme');
      expect(parsed.description).toBeUndefined();
      expect(parsed.author).toBeUndefined();
    });

    test('preserves nested object structure', () => {
      const json = serializer.format(defaultThemeConfig);
      const parsed = JSON.parse(json) as ThemeConfig;
      
      // Check deeply nested properties
      expect(parsed.light.colors.primary['500']).toBe(defaultThemeConfig.light.colors.primary['500']);
      expect(parsed.light.typography.fontFamily.primary).toBe(defaultThemeConfig.light.typography.fontFamily.primary);
      expect(parsed.dark.colors.background.default).toBe(defaultThemeConfig.dark.colors.background.default);
    });
  });

  describe('round-trip serialization', () => {
    test('serialize then parse produces equivalent theme', () => {
      const json = serializer.serialize(defaultThemeConfig);
      const parsed = JSON.parse(json) as ThemeConfig;
      
      expect(parsed).toEqual(defaultThemeConfig);
    });

    test('format with options then parse produces equivalent theme', () => {
      const json = serializer.format(defaultThemeConfig, { 
        indent: 4, 
        sortKeys: true 
      });
      const parsed = JSON.parse(json) as ThemeConfig;
      
      // Deep equality check
      expect(parsed.version).toBe(defaultThemeConfig.version);
      expect(parsed.name).toBe(defaultThemeConfig.name);
      expect(parsed.light).toEqual(defaultThemeConfig.light);
      expect(parsed.dark).toEqual(defaultThemeConfig.dark);
    });
  });
});
