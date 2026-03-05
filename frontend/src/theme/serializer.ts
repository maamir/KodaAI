/**
 * Theme Serializer for KodaAI AIDLC Management System
 * 
 * This module provides functionality to serialize ThemeConfig objects into
 * formatted JSON strings. It supports formatting options for customizing
 * the output format.
 */

import type { ThemeConfig } from './tokens';

/**
 * Options for formatting serialized theme JSON
 */
export interface FormatOptions {
  /**
   * Number of spaces for indentation (default: 2)
   */
  indent?: number;
  
  /**
   * Whether to sort object keys alphabetically (default: false)
   */
  sortKeys?: boolean;
}

/**
 * ThemeSerializer class for converting ThemeConfig objects to JSON strings
 */
export class ThemeSerializer {
  /**
   * Serialize a ThemeConfig object to a JSON string with default formatting
   * 
   * @param theme - ThemeConfig object to serialize
   * @returns JSON string representation of the theme
   */
  serialize(theme: ThemeConfig): string {
    return this.format(theme);
  }

  /**
   * Format a ThemeConfig object to a JSON string with custom formatting options
   * 
   * @param theme - ThemeConfig object to format
   * @param options - Formatting options (indent, sortKeys)
   * @returns Formatted JSON string representation of the theme
   */
  format(theme: ThemeConfig, options?: FormatOptions): string {
    const indent = options?.indent ?? 2;
    const sortKeys = options?.sortKeys ?? false;

    if (sortKeys) {
      // Sort keys recursively before stringifying
      const sortedTheme = this.sortObjectKeys(theme);
      return JSON.stringify(sortedTheme, null, indent);
    }

    return JSON.stringify(theme, null, indent);
  }

  /**
   * Recursively sort all keys in an object
   * 
   * @param obj - Object to sort
   * @returns New object with sorted keys
   */
  private sortObjectKeys(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    if (typeof obj === 'object') {
      const sorted: Record<string, unknown> = {};
      const keys = Object.keys(obj).sort();
      
      for (const key of keys) {
        sorted[key] = this.sortObjectKeys((obj as Record<string, unknown>)[key]);
      }
      
      return sorted;
    }

    return obj;
  }
}
