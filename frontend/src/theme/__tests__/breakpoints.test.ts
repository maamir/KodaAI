import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme } from '../index';

describe('Theme Breakpoints', () => {
  describe('Light Theme', () => {
    it('should have custom breakpoint values', () => {
      expect(lightTheme.breakpoints.values).toEqual({
        xs: 320,
        sm: 768,
        md: 1024,
        lg: 1440,
        xl: 1920,
      });
    });

    it('should generate correct media queries for "up" direction', () => {
      expect(lightTheme.breakpoints.up('xs')).toBe('@media (min-width:320px)');
      expect(lightTheme.breakpoints.up('sm')).toBe('@media (min-width:768px)');
      expect(lightTheme.breakpoints.up('md')).toBe('@media (min-width:1024px)');
      expect(lightTheme.breakpoints.up('lg')).toBe('@media (min-width:1440px)');
      expect(lightTheme.breakpoints.up('xl')).toBe('@media (min-width:1920px)');
    });

    it('should generate correct media queries for "down" direction', () => {
      expect(lightTheme.breakpoints.down('sm')).toBe('@media (max-width:767.95px)');
      expect(lightTheme.breakpoints.down('md')).toBe('@media (max-width:1023.95px)');
      expect(lightTheme.breakpoints.down('lg')).toBe('@media (max-width:1439.95px)');
      expect(lightTheme.breakpoints.down('xl')).toBe('@media (max-width:1919.95px)');
    });

    it('should generate correct media queries for "only" direction', () => {
      expect(lightTheme.breakpoints.only('xs')).toBe('@media (min-width:320px) and (max-width:767.95px)');
      expect(lightTheme.breakpoints.only('sm')).toBe('@media (min-width:768px) and (max-width:1023.95px)');
      expect(lightTheme.breakpoints.only('md')).toBe('@media (min-width:1024px) and (max-width:1439.95px)');
      expect(lightTheme.breakpoints.only('lg')).toBe('@media (min-width:1440px) and (max-width:1919.95px)');
    });

    it('should generate correct media queries for "between" direction', () => {
      expect(lightTheme.breakpoints.between('xs', 'sm')).toBe('@media (min-width:320px) and (max-width:767.95px)');
      expect(lightTheme.breakpoints.between('sm', 'md')).toBe('@media (min-width:768px) and (max-width:1023.95px)');
      expect(lightTheme.breakpoints.between('md', 'lg')).toBe('@media (min-width:1024px) and (max-width:1439.95px)');
      expect(lightTheme.breakpoints.between('lg', 'xl')).toBe('@media (min-width:1440px) and (max-width:1919.95px)');
    });
  });

  describe('Dark Theme', () => {
    it('should have the same custom breakpoint values as light theme', () => {
      expect(darkTheme.breakpoints.values).toEqual(lightTheme.breakpoints.values);
    });

    it('should generate the same media queries as light theme', () => {
      expect(darkTheme.breakpoints.up('md')).toBe(lightTheme.breakpoints.up('md'));
      expect(darkTheme.breakpoints.down('sm')).toBe(lightTheme.breakpoints.down('sm'));
      expect(darkTheme.breakpoints.only('lg')).toBe(lightTheme.breakpoints.only('lg'));
    });
  });

  describe('Breakpoint Requirements', () => {
    it('should meet requirement 2.1: mobile-first breakpoints at 320px, 768px, 1024px, 1440px', () => {
      const breakpoints = lightTheme.breakpoints.values;
      
      // Mobile portrait
      expect(breakpoints.xs).toBe(320);
      
      // Tablet portrait (mobile-first: >= 768px)
      expect(breakpoints.sm).toBe(768);
      
      // Tablet landscape / Small desktop (>= 1024px)
      expect(breakpoints.md).toBe(1024);
      
      // Desktop (>= 1440px)
      expect(breakpoints.lg).toBe(1440);
    });

    it('should support mobile viewport (< 768px)', () => {
      const mobileQuery = lightTheme.breakpoints.down('sm');
      expect(mobileQuery).toContain('max-width:767.95px');
    });

    it('should support tablet viewport (768px - 1023px)', () => {
      const tabletQuery = lightTheme.breakpoints.only('sm');
      expect(tabletQuery).toContain('min-width:768px');
      expect(tabletQuery).toContain('max-width:1023.95px');
    });

    it('should support desktop viewport (>= 1024px)', () => {
      const desktopQuery = lightTheme.breakpoints.up('md');
      expect(desktopQuery).toContain('min-width:1024px');
    });
  });
});
