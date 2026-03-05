/**
 * Tests for Material-UI theme integration
 * Verifies that design tokens are correctly mapped to Material-UI theme structure
 */

import { describe, test, expect } from 'vitest';
import { lightTheme, darkTheme, createThemeFromTokens } from '../index';
import { defaultLightTokens, defaultDarkTokens } from '../tokens';

describe('Material-UI Theme Integration', () => {
  describe('lightTheme', () => {
    test('should be created from default light tokens', () => {
      expect(lightTheme).toBeDefined();
      expect(lightTheme.palette.mode).toBe('light');
    });

    test('should map primary colors correctly', () => {
      expect(lightTheme.palette.primary.main).toBe(defaultLightTokens.colors.primary[500]);
      expect(lightTheme.palette.primary.light).toBe(defaultLightTokens.colors.primary[300]);
      expect(lightTheme.palette.primary.dark).toBe(defaultLightTokens.colors.primary[700]);
    });

    test('should map secondary colors correctly', () => {
      expect(lightTheme.palette.secondary.main).toBe(defaultLightTokens.colors.secondary[500]);
      expect(lightTheme.palette.secondary.light).toBe(defaultLightTokens.colors.secondary[300]);
      expect(lightTheme.palette.secondary.dark).toBe(defaultLightTokens.colors.secondary[700]);
    });

    test('should map semantic colors correctly', () => {
      expect(lightTheme.palette.success.main).toBe(defaultLightTokens.colors.success[500]);
      expect(lightTheme.palette.error.main).toBe(defaultLightTokens.colors.error[500]);
      expect(lightTheme.palette.warning.main).toBe(defaultLightTokens.colors.warning[500]);
      expect(lightTheme.palette.info.main).toBe(defaultLightTokens.colors.info[500]);
    });

    test('should map background colors correctly', () => {
      expect(lightTheme.palette.background.default).toBe(defaultLightTokens.colors.background.default);
      expect(lightTheme.palette.background.paper).toBe(defaultLightTokens.colors.background.paper);
    });

    test('should map text colors correctly', () => {
      expect(lightTheme.palette.text.primary).toBe(defaultLightTokens.colors.text.primary);
      expect(lightTheme.palette.text.secondary).toBe(defaultLightTokens.colors.text.secondary);
      expect(lightTheme.palette.text.disabled).toBe(defaultLightTokens.colors.text.disabled);
    });

    test('should map typography correctly', () => {
      expect(lightTheme.typography.fontFamily).toBe(defaultLightTokens.typography.fontFamily.primary);
      expect(lightTheme.typography.fontWeightRegular).toBe(defaultLightTokens.typography.fontWeight.normal);
      expect(lightTheme.typography.fontWeightMedium).toBe(defaultLightTokens.typography.fontWeight.medium);
      expect(lightTheme.typography.fontWeightBold).toBe(defaultLightTokens.typography.fontWeight.bold);
    });

    test('should map typography variants correctly', () => {
      expect(lightTheme.typography.h1.fontSize).toBe(defaultLightTokens.typography.fontSize['4xl']);
      expect(lightTheme.typography.h2.fontSize).toBe(defaultLightTokens.typography.fontSize['3xl']);
      expect(lightTheme.typography.h3.fontSize).toBe(defaultLightTokens.typography.fontSize['2xl']);
      expect(lightTheme.typography.body1.fontSize).toBe(defaultLightTokens.typography.fontSize.base);
      expect(lightTheme.typography.body2.fontSize).toBe(defaultLightTokens.typography.fontSize.sm);
    });

    test('should have spacing function', () => {
      expect(typeof lightTheme.spacing).toBe('function');
      // spacing(1) should be 8px (0.5rem * 16)
      expect(lightTheme.spacing(1)).toBe('8px');
      expect(lightTheme.spacing(2)).toBe('16px');
    });

    test('should map shape border radius correctly', () => {
      // borderRadius.md = '0.5rem' = 8px
      expect(lightTheme.shape.borderRadius).toBe(8);
    });

    test('should have shadows array', () => {
      expect(Array.isArray(lightTheme.shadows)).toBe(true);
      expect(lightTheme.shadows.length).toBe(25); // Material-UI requires 25 shadow levels
      expect(lightTheme.shadows[0]).toBe('none');
    });

    test('should have component overrides', () => {
      expect(lightTheme.components?.MuiCard).toBeDefined();
      expect(lightTheme.components?.MuiButton).toBeDefined();
      expect(lightTheme.components?.MuiPaper).toBeDefined();
    });
  });

  describe('darkTheme', () => {
    test('should be created from default dark tokens', () => {
      expect(darkTheme).toBeDefined();
      expect(darkTheme.palette.mode).toBe('dark');
    });

    test('should map primary colors correctly', () => {
      expect(darkTheme.palette.primary.main).toBe(defaultDarkTokens.colors.primary[500]);
      expect(darkTheme.palette.primary.light).toBe(defaultDarkTokens.colors.primary[300]);
      expect(darkTheme.palette.primary.dark).toBe(defaultDarkTokens.colors.primary[700]);
    });

    test('should map background colors correctly', () => {
      expect(darkTheme.palette.background.default).toBe(defaultDarkTokens.colors.background.default);
      expect(darkTheme.palette.background.paper).toBe(defaultDarkTokens.colors.background.paper);
    });

    test('should map text colors correctly', () => {
      expect(darkTheme.palette.text.primary).toBe(defaultDarkTokens.colors.text.primary);
      expect(darkTheme.palette.text.secondary).toBe(defaultDarkTokens.colors.text.secondary);
      expect(darkTheme.palette.text.disabled).toBe(defaultDarkTokens.colors.text.disabled);
    });

    test('should have different divider color than light theme', () => {
      expect(darkTheme.palette.divider).not.toBe(lightTheme.palette.divider);
      expect(darkTheme.palette.divider).toBe('rgba(255, 255, 255, 0.12)');
    });
  });

  describe('createThemeFromTokens', () => {
    test('should create theme from custom tokens', () => {
      const customTokens = {
        ...defaultLightTokens,
        colors: {
          ...defaultLightTokens.colors,
          primary: {
            ...defaultLightTokens.colors.primary,
            500: '#ff0000',
          },
        },
      };

      const customTheme = createThemeFromTokens(customTokens, 'light');
      
      expect(customTheme.palette.primary.main).toBe('#ff0000');
      expect(customTheme.palette.mode).toBe('light');
    });

    test('should create dark theme from custom tokens', () => {
      const customTokens = {
        ...defaultDarkTokens,
        colors: {
          ...defaultDarkTokens.colors,
          background: {
            default: '#000000',
            paper: '#111111',
            elevated: '#222222',
          },
        },
      };

      const customTheme = createThemeFromTokens(customTokens, 'dark');
      
      expect(customTheme.palette.background.default).toBe('#000000');
      expect(customTheme.palette.background.paper).toBe('#111111');
      expect(customTheme.palette.mode).toBe('dark');
    });
  });

  describe('theme consistency', () => {
    test('light and dark themes should have same structure', () => {
      // Both themes should have the same keys
      expect(Object.keys(lightTheme.palette)).toEqual(Object.keys(darkTheme.palette));
      expect(Object.keys(lightTheme.typography)).toEqual(Object.keys(darkTheme.typography));
    });

    test('both themes should have component overrides', () => {
      const lightComponents = Object.keys(lightTheme.components || {});
      const darkComponents = Object.keys(darkTheme.components || {});
      
      expect(lightComponents).toEqual(darkComponents);
    });
  });
});
