/**
 * Tests for ThemeEngine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeEngine } from '../engine';
import { defaultThemeConfig } from '../tokens';

describe('ThemeEngine', () => {
  let engine: ThemeEngine;

  beforeEach(() => {
    // Clear local storage before each test
    localStorage.clear();
    
    // Reset matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    if (engine) {
      engine.destroy();
    }
  });

  describe('initialization', () => {
    it('should initialize with light mode by default when no preference is stored', () => {
      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('light');
    });

    it('should initialize with dark mode when system prefers dark', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)' ? true : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('dark');
    });

    it('should initialize with stored preference over system preference', () => {
      localStorage.setItem('kodaai-theme-preference', 'dark');
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false, // System prefers light
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('dark'); // Should use stored preference
    });

    it('should accept custom theme configuration', () => {
      const customTheme = { ...defaultThemeConfig, name: 'Custom Theme' };
      engine = new ThemeEngine(customTheme);
      
      expect(engine.getThemeConfig().name).toBe('Custom Theme');
    });
  });

  describe('getMode', () => {
    it('should return the current theme mode', () => {
      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('light');
    });
  });

  describe('getTokens', () => {
    it('should return light tokens when in light mode', () => {
      engine = new ThemeEngine();
      const tokens = engine.getTokens();
      
      expect(tokens).toBe(defaultThemeConfig.light);
    });

    it('should return dark tokens when in dark mode', () => {
      localStorage.setItem('kodaai-theme-preference', 'dark');
      engine = new ThemeEngine();
      const tokens = engine.getTokens();
      
      expect(tokens).toBe(defaultThemeConfig.dark);
    });
  });

  describe('setMode', () => {
    it('should change the theme mode', () => {
      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('light');
      
      engine.setMode('dark');
      expect(engine.getMode()).toBe('dark');
    });

    it('should persist the preference to local storage', () => {
      engine = new ThemeEngine();
      engine.setMode('dark');
      
      expect(localStorage.getItem('kodaai-theme-preference')).toBe('dark');
    });

    it('should notify listeners when mode changes', () => {
      engine = new ThemeEngine();
      const listener = vi.fn();
      
      engine.subscribe(listener);
      engine.setMode('dark');
      
      expect(listener).toHaveBeenCalledWith('dark');
    });

    it('should not notify listeners if mode does not change', () => {
      engine = new ThemeEngine();
      const listener = vi.fn();
      
      engine.subscribe(listener);
      engine.setMode('light'); // Already light
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('toggleMode', () => {
    it('should toggle from light to dark', () => {
      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('light');
      
      engine.toggleMode();
      expect(engine.getMode()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      localStorage.setItem('kodaai-theme-preference', 'dark');
      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('dark');
      
      engine.toggleMode();
      expect(engine.getMode()).toBe('light');
    });

    it('should persist the toggled preference', () => {
      engine = new ThemeEngine();
      engine.toggleMode();
      
      expect(localStorage.getItem('kodaai-theme-preference')).toBe('dark');
    });
  });

  describe('clearPreference', () => {
    it('should remove stored preference from local storage', () => {
      engine = new ThemeEngine();
      engine.setMode('dark');
      expect(localStorage.getItem('kodaai-theme-preference')).toBe('dark');
      
      engine.clearPreference();
      expect(localStorage.getItem('kodaai-theme-preference')).toBeNull();
    });

    it('should fall back to system preference after clearing', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)' ? true : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      engine = new ThemeEngine();
      engine.setMode('light');
      expect(engine.getMode()).toBe('light');
      
      engine.clearPreference();
      expect(engine.getMode()).toBe('dark'); // Should use system preference
    });
  });

  describe('setThemeConfig', () => {
    it('should update the theme configuration', () => {
      engine = new ThemeEngine();
      const customTheme = { ...defaultThemeConfig, name: 'New Theme' };
      
      engine.setThemeConfig(customTheme);
      expect(engine.getThemeConfig().name).toBe('New Theme');
    });

    it('should notify listeners when theme config changes', () => {
      engine = new ThemeEngine();
      const listener = vi.fn();
      
      engine.subscribe(listener);
      const customTheme = { ...defaultThemeConfig, name: 'New Theme' };
      engine.setThemeConfig(customTheme);
      
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should call listener when mode changes', () => {
      engine = new ThemeEngine();
      const listener = vi.fn();
      
      engine.subscribe(listener);
      engine.setMode('dark');
      
      expect(listener).toHaveBeenCalledWith('dark');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      engine = new ThemeEngine();
      const listener = vi.fn();
      
      const unsubscribe = engine.subscribe(listener);
      engine.setMode('dark');
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      engine.setMode('light');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle multiple listeners', () => {
      engine = new ThemeEngine();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      engine.subscribe(listener1);
      engine.subscribe(listener2);
      engine.setMode('dark');
      
      expect(listener1).toHaveBeenCalledWith('dark');
      expect(listener2).toHaveBeenCalledWith('dark');
    });

    it('should handle listener errors gracefully', () => {
      engine = new ThemeEngine();
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();
      
      engine.subscribe(errorListener);
      engine.subscribe(normalListener);
      
      // Should not throw
      expect(() => engine.setMode('dark')).not.toThrow();
      
      // Normal listener should still be called
      expect(normalListener).toHaveBeenCalledWith('dark');
    });
  });

  describe('system preference changes', () => {
    it('should update mode when system preference changes and no stored preference exists', () => {
      const listeners: Array<(e: MediaQueryListEvent) => void> = [];
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
            if (event === 'change') {
              listeners.push(listener);
            }
          }),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('light');
      
      // Simulate system preference change to dark
      listeners.forEach(listener => {
        listener({ matches: true } as MediaQueryListEvent);
      });
      
      expect(engine.getMode()).toBe('dark');
    });

    it('should not update mode when system preference changes if user has stored preference', () => {
      localStorage.setItem('kodaai-theme-preference', 'light');
      
      const listeners: Array<(e: MediaQueryListEvent) => void> = [];
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
            if (event === 'change') {
              listeners.push(listener);
            }
          }),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      engine = new ThemeEngine();
      expect(engine.getMode()).toBe('light');
      
      // Simulate system preference change to dark
      listeners.forEach(listener => {
        listener({ matches: true } as MediaQueryListEvent);
      });
      
      // Should remain light because user has explicit preference
      expect(engine.getMode()).toBe('light');
    });
  });

  describe('destroy', () => {
    it('should clear all listeners', () => {
      engine = new ThemeEngine();
      const listener = vi.fn();
      
      engine.subscribe(listener);
      engine.destroy();
      engine.setMode('dark');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
