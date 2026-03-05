import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTheme, resetThemeEngine } from '../useTheme';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('useTheme', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Default to light mode
    window.matchMedia = createMatchMediaMock(false);
    // Reset the singleton ThemeEngine before each test
    resetThemeEngine();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with light mode by default', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.mode).toBe('light');
      expect(result.current.tokens).toBeDefined();
      expect(result.current.tokens.colors).toBeDefined();
    });

    it('should initialize with dark mode when system prefers dark', async () => {
      localStorageMock.clear();
      window.matchMedia = createMatchMediaMock(true);

      const { result } = renderHook(() => useTheme());

      // Wait for the hook to initialize
      await waitFor(() => {
        expect(result.current.mode).toBe('dark');
      });
    });

    it('should initialize with stored preference from localStorage', async () => {
      localStorageMock.clear();
      localStorageMock.setItem('kodaai-theme-preference', 'dark');

      const { result } = renderHook(() => useTheme());

      // Wait for the hook to initialize
      await waitFor(() => {
        expect(result.current.mode).toBe('dark');
      });
    });
  });

  describe('setMode', () => {
    it('should change theme mode to dark', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setMode('dark');
      });

      expect(result.current.mode).toBe('dark');
    });

    it('should change theme mode to light', () => {
      localStorageMock.setItem('kodaai-theme-preference', 'dark');
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setMode('light');
      });

      expect(result.current.mode).toBe('light');
    });

    it('should persist mode to localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setMode('dark');
      });

      expect(localStorageMock.getItem('kodaai-theme-preference')).toBe('dark');
    });

    it('should update tokens when mode changes', async () => {
      const { result } = renderHook(() => useTheme());
      const lightTokens = result.current.tokens;

      act(() => {
        result.current.setMode('dark');
      });

      await waitFor(() => {
        const darkTokens = result.current.tokens;
        // Tokens should be different between light and dark modes
        expect(darkTokens.colors.background.default).not.toBe(lightTokens.colors.background.default);
      });
    });
  });

  describe('toggleMode', () => {
    it('should toggle from light to dark', async () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleMode();
      });

      await waitFor(() => {
        expect(result.current.mode).toBe('dark');
      });
    });

    it('should toggle from dark to light', async () => {
      localStorageMock.setItem('kodaai-theme-preference', 'dark');
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.mode).toBe('dark');
      });

      act(() => {
        result.current.toggleMode();
      });

      await waitFor(() => {
        expect(result.current.mode).toBe('light');
      });
    });

    it('should toggle multiple times', async () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleMode(); // light -> dark
      });
      
      await waitFor(() => {
        expect(result.current.mode).toBe('dark');
      });

      act(() => {
        result.current.toggleMode(); // dark -> light
      });
      
      await waitFor(() => {
        expect(result.current.mode).toBe('light');
      });

      act(() => {
        result.current.toggleMode(); // light -> dark
      });
      
      await waitFor(() => {
        expect(result.current.mode).toBe('dark');
      });
    });
  });

  describe('importTheme', () => {
    it('should import valid theme JSON', () => {
      const { result } = renderHook(() => useTheme());

      const validThemeJson = JSON.stringify({
        version: '1.0',
        name: 'Test Theme',
        light: result.current.tokens,
        dark: result.current.tokens,
      });

      let importResult;
      act(() => {
        importResult = result.current.importTheme(validThemeJson);
      });

      expect(importResult.success).toBe(true);
      expect(importResult.errors).toBeUndefined();
    });

    it('should reject invalid JSON syntax', () => {
      const { result } = renderHook(() => useTheme());

      let importResult;
      act(() => {
        importResult = result.current.importTheme('{ invalid json }');
      });

      expect(importResult.success).toBe(false);
      expect(importResult.errors).toBeDefined();
      expect(importResult.errors![0]).toContain('Invalid JSON syntax');
    });

    it('should reject theme missing required fields', () => {
      const { result } = renderHook(() => useTheme());

      const invalidThemeJson = JSON.stringify({
        version: '1.0',
        // Missing name, light, and dark
      });

      let importResult;
      act(() => {
        importResult = result.current.importTheme(invalidThemeJson);
      });

      expect(importResult.success).toBe(false);
      expect(importResult.errors).toBeDefined();
      expect(importResult.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('exportTheme', () => {
    it('should export current theme as JSON string', () => {
      const { result } = renderHook(() => useTheme());

      let exportedJson: string;
      act(() => {
        exportedJson = result.current.exportTheme();
      });

      expect(exportedJson).toBeDefined();
      expect(() => JSON.parse(exportedJson)).not.toThrow();
    });

    it('should export theme that can be re-imported', () => {
      const { result } = renderHook(() => useTheme());

      let exportedJson: string;
      act(() => {
        exportedJson = result.current.exportTheme();
      });

      let importResult;
      act(() => {
        importResult = result.current.importTheme(exportedJson);
      });

      expect(importResult.success).toBe(true);
    });

    it('should export theme with all required fields', () => {
      const { result } = renderHook(() => useTheme());

      let exportedJson: string;
      act(() => {
        exportedJson = result.current.exportTheme();
      });

      const parsed = JSON.parse(exportedJson);
      expect(parsed.version).toBeDefined();
      expect(parsed.name).toBeDefined();
      expect(parsed.light).toBeDefined();
      expect(parsed.dark).toBeDefined();
    });
  });

  describe('tokens', () => {
    it('should provide design tokens for current mode', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.tokens).toBeDefined();
      expect(result.current.tokens.colors).toBeDefined();
      expect(result.current.tokens.typography).toBeDefined();
      expect(result.current.tokens.spacing).toBeDefined();
      expect(result.current.tokens.shadows).toBeDefined();
      expect(result.current.tokens.borderRadius).toBeDefined();
    });

    it('should provide different tokens for light and dark modes', async () => {
      const { result } = renderHook(() => useTheme());
      
      const lightBackground = result.current.tokens.colors.background.default;

      act(() => {
        result.current.setMode('dark');
      });

      await waitFor(() => {
        const darkBackground = result.current.tokens.colors.background.default;
        expect(lightBackground).not.toBe(darkBackground);
      });
    });
  });

  describe('multiple hook instances', () => {
    it('should share theme state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useTheme());
      const { result: result2 } = renderHook(() => useTheme());

      expect(result1.current.mode).toBe(result2.current.mode);

      act(() => {
        result1.current.setMode('dark');
      });

      expect(result1.current.mode).toBe('dark');
      expect(result2.current.mode).toBe('dark');
    });

    it('should sync mode changes across instances', () => {
      const { result: result1 } = renderHook(() => useTheme());
      const { result: result2 } = renderHook(() => useTheme());

      act(() => {
        result1.current.toggleMode();
      });

      expect(result1.current.mode).toBe(result2.current.mode);

      act(() => {
        result2.current.toggleMode();
      });

      expect(result1.current.mode).toBe(result2.current.mode);
    });
  });
});
