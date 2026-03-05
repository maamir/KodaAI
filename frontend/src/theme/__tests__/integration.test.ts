/**
 * Integration tests for ThemeParser and ThemeSerializer
 * Tests the round-trip functionality: serialize → parse → serialize
 */

import { describe, test, expect } from 'vitest';
import { ThemeParser } from '../parser';
import { ThemeSerializer } from '../serializer';
import { defaultThemeConfig } from '../tokens';
import type { ThemeConfig } from '../tokens';

describe('Theme Parser and Serializer Integration', () => {
  const parser = new ThemeParser();
  const serializer = new ThemeSerializer();

  describe('round-trip: serialize → parse → serialize', () => {
    test('produces equivalent JSON after round-trip', () => {
      // Step 1: Serialize the default theme
      const json1 = serializer.serialize(defaultThemeConfig);
      
      // Step 2: Parse the JSON back to a theme object
      const parseResult = parser.parse(json1);
      expect(parseResult.success).toBe(true);
      expect(parseResult.theme).toBeDefined();
      
      // Step 3: Serialize again
      const json2 = serializer.serialize(parseResult.theme!);
      
      // Step 4: Compare - should be identical
      expect(json2).toBe(json1);
    });

    test('preserves all theme data through round-trip', () => {
      const json = serializer.serialize(defaultThemeConfig);
      const parseResult = parser.parse(json);
      
      expect(parseResult.success).toBe(true);
      expect(parseResult.theme).toEqual(defaultThemeConfig);
    });

    test('works with custom formatting options', () => {
      // Serialize with custom options
      const json1 = serializer.format(defaultThemeConfig, { 
        indent: 4, 
        sortKeys: true 
      });
      
      // Parse
      const parseResult = parser.parse(json1);
      expect(parseResult.success).toBe(true);
      
      // Serialize again with same options
      const json2 = serializer.format(parseResult.theme!, { 
        indent: 4, 
        sortKeys: true 
      });
      
      // Should be identical
      expect(json2).toBe(json1);
    });

    test('handles modified theme through round-trip', () => {
      // Create a modified theme
      const modifiedTheme: ThemeConfig = {
        ...defaultThemeConfig,
        name: 'Custom Theme',
        description: 'A custom theme for testing',
        light: {
          ...defaultThemeConfig.light,
          colors: {
            ...defaultThemeConfig.light.colors,
            primary: {
              ...defaultThemeConfig.light.colors.primary,
              500: '#ff0000', // Change primary color
            },
          },
        },
      };
      
      // Serialize
      const json = serializer.serialize(modifiedTheme);
      
      // Parse
      const parseResult = parser.parse(json);
      expect(parseResult.success).toBe(true);
      
      // Verify modifications are preserved
      expect(parseResult.theme?.name).toBe('Custom Theme');
      expect(parseResult.theme?.description).toBe('A custom theme for testing');
      expect(parseResult.theme?.light.colors.primary['500']).toBe('#ff0000');
    });
  });

  describe('error handling in integration', () => {
    test('parser rejects invalid JSON from corrupted serialization', () => {
      const json = serializer.serialize(defaultThemeConfig);
      
      // Corrupt the JSON
      const corruptedJson = json.slice(0, -10); // Remove last 10 characters
      
      const parseResult = parser.parse(corruptedJson);
      expect(parseResult.success).toBe(false);
      expect(parseResult.errors).toBeDefined();
      expect(parseResult.errors!.length).toBeGreaterThan(0);
    });

    test('parser validates theme structure after serialization', () => {
      // Create an invalid theme (missing required fields)
      const invalidTheme = {
        version: '1.0',
        // Missing 'name', 'light', and 'dark'
      };
      
      const json = JSON.stringify(invalidTheme);
      const parseResult = parser.parse(json);
      
      expect(parseResult.success).toBe(false);
      expect(parseResult.errors).toBeDefined();
      expect(parseResult.errors!.some(e => e.includes('name'))).toBe(true);
      expect(parseResult.errors!.some(e => e.includes('light'))).toBe(true);
      expect(parseResult.errors!.some(e => e.includes('dark'))).toBe(true);
    });
  });

  describe('export and import workflow', () => {
    test('simulates user exporting and importing a theme', () => {
      // User exports their current theme
      const exportedJson = serializer.format(defaultThemeConfig, { 
        indent: 2, 
        sortKeys: true 
      });
      
      // User saves to file and later imports it
      // (simulated by parsing the JSON)
      const importResult = parser.parse(exportedJson);
      
      expect(importResult.success).toBe(true);
      expect(importResult.theme).toEqual(defaultThemeConfig);
    });

    test('handles theme customization workflow', () => {
      // 1. User starts with default theme
      const startTheme = defaultThemeConfig;
      
      // 2. User exports it
      const exported = serializer.serialize(startTheme);
      
      // 3. User modifies the JSON manually
      const parsed = JSON.parse(exported) as ThemeConfig;
      parsed.name = 'My Custom Theme';
      parsed.light.colors.primary['500'] = '#00ff00';
      
      // 4. User imports the modified theme
      const modifiedJson = JSON.stringify(parsed, null, 2);
      const importResult = parser.parse(modifiedJson);
      
      expect(importResult.success).toBe(true);
      expect(importResult.theme?.name).toBe('My Custom Theme');
      expect(importResult.theme?.light.colors.primary['500']).toBe('#00ff00');
    });
  });
});
