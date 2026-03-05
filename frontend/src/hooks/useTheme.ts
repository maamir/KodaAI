/**
 * useTheme Hook for KodaAI AIDLC Management System
 * 
 * This hook provides a React interface to the ThemeEngine, allowing components
 * to access and control the theme system. It exposes the current theme mode,
 * design tokens, and methods for theme manipulation including import/export.
 */

import { useState, useEffect, useMemo } from 'react';
import { ThemeEngine, type ThemeMode } from '../theme/engine';
import { ThemeParser, type ThemeParseResult } from '../theme/parser';
import { ThemeSerializer } from '../theme/serializer';
import type { DesignTokens, ThemeConfig } from '../theme/tokens';

/**
 * Return type for the useTheme hook
 */
export interface UseThemeReturn {
  /**
   * Current theme mode ('light' or 'dark')
   */
  mode: ThemeMode;
  
  /**
   * Design tokens for the current theme mode
   */
  tokens: DesignTokens;
  
  /**
   * Set the theme mode explicitly
   */
  setMode: (mode: ThemeMode) => void;
  
  /**
   * Toggle between light and dark modes
   */
  toggleMode: () => void;
  
  /**
   * Import a theme from JSON string
   * Returns parse result with success status and any errors
   */
  importTheme: (json: string) => ThemeParseResult;
  
  /**
   * Export the current theme configuration as JSON string
   */
  exportTheme: () => string;
}

// Singleton ThemeEngine instance shared across all hook instances
let themeEngineInstance: ThemeEngine | null = null;

/**
 * Get or create the singleton ThemeEngine instance
 */
function getThemeEngine(): ThemeEngine {
  if (!themeEngineInstance) {
    themeEngineInstance = new ThemeEngine();
  }
  return themeEngineInstance;
}

/**
 * Reset the singleton ThemeEngine instance (for testing purposes)
 * @internal
 */
export function resetThemeEngine(): void {
  if (themeEngineInstance) {
    themeEngineInstance.destroy();
    themeEngineInstance = null;
  }
}

/**
 * useTheme hook - Provides access to theme system
 * 
 * This hook connects React components to the ThemeEngine, providing:
 * - Current theme mode and design tokens
 * - Methods to change theme mode
 * - Theme import/export functionality
 * 
 * The hook automatically re-renders components when the theme changes.
 * 
 * @returns UseThemeReturn object with theme state and methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { mode, tokens, toggleMode } = useTheme();
 *   
 *   return (
 *     <div style={{ backgroundColor: tokens.colors.background.default }}>
 *       <p>Current mode: {mode}</p>
 *       <button onClick={toggleMode}>Toggle Theme</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  const engine = getThemeEngine();
  
  // State for current theme mode
  const [mode, setModeState] = useState<ThemeMode>(engine.getMode());
  
  // Subscribe to theme changes from the engine
  useEffect(() => {
    const unsubscribe = engine.subscribe((newMode) => {
      setModeState(newMode);
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [engine]);
  
  // Get current design tokens (memoized to prevent unnecessary recalculations)
  const tokens = useMemo(() => engine.getTokens(), [engine, mode]);
  
  // Create parser and serializer instances (memoized)
  const parser = useMemo(() => new ThemeParser(), []);
  const serializer = useMemo(() => new ThemeSerializer(), []);
  
  /**
   * Set theme mode
   */
  const setMode = (newMode: ThemeMode) => {
    engine.setMode(newMode);
  };
  
  /**
   * Toggle between light and dark modes
   */
  const toggleMode = () => {
    engine.toggleMode();
  };
  
  /**
   * Import a theme from JSON string
   * Parses and validates the JSON, then applies it if valid
   */
  const importTheme = (json: string): ThemeParseResult => {
    const result = parser.parse(json);
    
    if (result.success && result.theme) {
      // Apply the imported theme to the engine
      engine.setThemeConfig(result.theme);
    }
    
    return result;
  };
  
  /**
   * Export the current theme configuration as JSON
   */
  const exportTheme = (): string => {
    const themeConfig = engine.getThemeConfig();
    return serializer.serialize(themeConfig);
  };
  
  return {
    mode,
    tokens,
    setMode,
    toggleMode,
    importTheme,
    exportTheme,
  };
}
