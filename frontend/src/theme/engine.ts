/**
 * Theme Engine for KodaAI AIDLC Management System
 * 
 * This module provides the ThemeEngine class that manages theme mode switching
 * (light/dark), system color scheme detection, and theme preference persistence
 * in local storage.
 */

import { defaultThemeConfig, type ThemeConfig, type DesignTokens } from './tokens';

/**
 * Theme mode type
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Local storage key for theme preference
 */
const THEME_STORAGE_KEY = 'kodaai-theme-preference';

/**
 * ThemeEngine class for managing theme mode and persistence
 */
export class ThemeEngine {
  private mode: ThemeMode;
  private themeConfig: ThemeConfig;
  private listeners: Set<(mode: ThemeMode) => void>;
  private systemPreferenceQuery: MediaQueryList | null;

  /**
   * Create a new ThemeEngine instance
   * 
   * @param customTheme - Optional custom theme configuration (defaults to defaultThemeConfig)
   */
  constructor(customTheme?: ThemeConfig) {
    this.themeConfig = customTheme || defaultThemeConfig;
    this.listeners = new Set();
    this.systemPreferenceQuery = null;

    // Initialize mode from local storage or system preference
    this.mode = this.getInitialMode();

    // Set up system preference change listener
    this.setupSystemPreferenceListener();
  }

  /**
   * Get the initial theme mode from local storage or system preference
   * 
   * @returns Initial theme mode
   */
  private getInitialMode(): ThemeMode {
    // Check local storage first
    const stored = this.getStoredPreference();
    if (stored) {
      return stored;
    }

    // Fall back to system preference
    return this.getSystemPreference();
  }

  /**
   * Get stored theme preference from local storage
   * 
   * @returns Stored theme mode or null if not found
   */
  private getStoredPreference(): ThemeMode | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (error) {
      // Local storage might not be available (e.g., in SSR or private browsing)
      console.warn('Failed to read theme preference from local storage:', error);
    }
    return null;
  }

  /**
   * Detect system color scheme preference
   * 
   * @returns System theme preference ('light' or 'dark')
   */
  private getSystemPreference(): ThemeMode {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light'; // Default to light mode in non-browser environments
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  /**
   * Set up listener for system color scheme preference changes
   */
  private setupSystemPreferenceListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return; // Not in browser environment
    }

    try {
      this.systemPreferenceQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Use addEventListener if available (modern browsers)
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        // Only update if user hasn't set an explicit preference
        if (!this.getStoredPreference()) {
          const newMode: ThemeMode = e.matches ? 'dark' : 'light';
          this.mode = newMode;
          this.notifyListeners();
        }
      };

      if (this.systemPreferenceQuery.addEventListener) {
        this.systemPreferenceQuery.addEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        this.systemPreferenceQuery.addListener(handleChange as (e: MediaQueryListEvent) => void);
      }
    } catch (error) {
      console.warn('Failed to set up system preference listener:', error);
    }
  }

  /**
   * Get the current theme mode
   * 
   * @returns Current theme mode ('light' or 'dark')
   */
  getMode(): ThemeMode {
    return this.mode;
  }

  /**
   * Get the current design tokens based on the active mode
   * 
   * @returns Design tokens for the current mode
   */
  getTokens(): DesignTokens {
    return this.mode === 'dark' ? this.themeConfig.dark : this.themeConfig.light;
  }

  /**
   * Get the complete theme configuration
   * 
   * @returns Current theme configuration
   */
  getThemeConfig(): ThemeConfig {
    return this.themeConfig;
  }

  /**
   * Set the theme mode and persist to local storage
   * 
   * @param mode - Theme mode to set ('light' or 'dark')
   */
  setMode(mode: ThemeMode): void {
    if (this.mode === mode) {
      return; // No change needed
    }

    this.mode = mode;
    this.persistPreference(mode);
    this.notifyListeners();
  }

  /**
   * Toggle between light and dark modes
   */
  toggleMode(): void {
    const newMode: ThemeMode = this.mode === 'light' ? 'dark' : 'light';
    this.setMode(newMode);
  }

  /**
   * Persist theme preference to local storage
   * 
   * @param mode - Theme mode to persist
   */
  private persistPreference(mode: ThemeMode): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to persist theme preference to local storage:', error);
    }
  }

  /**
   * Clear stored theme preference (will fall back to system preference)
   */
  clearPreference(): void {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
      // Update to system preference
      this.mode = this.getSystemPreference();
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to clear theme preference from local storage:', error);
    }
  }

  /**
   * Update the theme configuration
   * 
   * @param themeConfig - New theme configuration
   */
  setThemeConfig(themeConfig: ThemeConfig): void {
    this.themeConfig = themeConfig;
    this.notifyListeners();
  }

  /**
   * Subscribe to theme mode changes
   * 
   * @param listener - Callback function to be called when mode changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (mode: ThemeMode) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of mode change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.mode);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }

  /**
   * Clean up resources (remove event listeners)
   */
  destroy(): void {
    // Remove system preference listener
    if (this.systemPreferenceQuery) {
      try {
        if (this.systemPreferenceQuery.removeEventListener) {
          this.systemPreferenceQuery.removeEventListener('change', () => {});
        } else {
          // Fallback for older browsers
          this.systemPreferenceQuery.removeListener(() => {});
        }
      } catch (error) {
        console.warn('Failed to remove system preference listener:', error);
      }
    }

    // Clear all listeners
    this.listeners.clear();
  }
}
