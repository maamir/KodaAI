import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { createElement } from 'react';
import {
  useBreakpoint,
  useCurrentBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useResponsiveValue,
} from '../useBreakpoint';

// Mock useMediaQuery
vi.mock('@mui/material/useMediaQuery', () => ({
  default: vi.fn(),
}));

import useMediaQuery from '@mui/material/useMediaQuery';

const mockUseMediaQuery = useMediaQuery as unknown as ReturnType<typeof vi.fn>;

// Create a theme with custom breakpoints
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 320,
      sm: 768,
      md: 1024,
      lg: 1440,
      xl: 1920,
    },
  },
});

// Wrapper component for tests
function wrapper({ children }: { children: React.ReactNode }) {
  return createElement(ThemeProvider, { theme }, children);
}

describe('useBreakpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for "up" direction when viewport is larger', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useBreakpoint('md', 'up'), { wrapper });
    
    expect(result.current).toBe(true);
  });

  it('should return false for "up" direction when viewport is smaller', () => {
    mockUseMediaQuery.mockReturnValue(false);
    
    const { result } = renderHook(() => useBreakpoint('md', 'up'), { wrapper });
    
    expect(result.current).toBe(false);
  });

  it('should return true for "down" direction when viewport is smaller', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useBreakpoint('sm', 'down'), { wrapper });
    
    expect(result.current).toBe(true);
  });

  it('should return true for "only" direction when viewport matches exactly', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useBreakpoint('sm', 'only'), { wrapper });
    
    expect(result.current).toBe(true);
  });

  it('should default to "up" direction when not specified', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useBreakpoint('md'), { wrapper });
    
    expect(result.current).toBe(true);
  });
});

describe('useCurrentBreakpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return "xs" for mobile viewport', () => {
    // All breakpoints return false (viewport < 768px)
    mockUseMediaQuery.mockReturnValue(false);
    
    const { result } = renderHook(() => useCurrentBreakpoint(), { wrapper });
    
    expect(result.current).toBe('xs');
  });

  it('should return "sm" for tablet viewport', () => {
    // sm is true, md+ are false (768px <= viewport < 1024px)
    mockUseMediaQuery.mockImplementation((query: string) => {
      return query.includes('768px');
    });
    
    const { result } = renderHook(() => useCurrentBreakpoint(), { wrapper });
    
    expect(result.current).toBe('sm');
  });

  it('should return "md" for small desktop viewport', () => {
    // sm and md are true, lg+ are false (1024px <= viewport < 1440px)
    mockUseMediaQuery.mockImplementation((query: string) => {
      return query.includes('768px') || query.includes('1024px');
    });
    
    const { result } = renderHook(() => useCurrentBreakpoint(), { wrapper });
    
    expect(result.current).toBe('md');
  });

  it('should return "lg" for desktop viewport', () => {
    // sm, md, lg are true, xl is false (1440px <= viewport < 1920px)
    mockUseMediaQuery.mockImplementation((query: string) => {
      return !query.includes('1920px');
    });
    
    const { result } = renderHook(() => useCurrentBreakpoint(), { wrapper });
    
    expect(result.current).toBe('lg');
  });

  it('should return "xl" for large desktop viewport', () => {
    // All breakpoints return true (viewport >= 1920px)
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useCurrentBreakpoint(), { wrapper });
    
    expect(result.current).toBe('xl');
  });
});

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for viewport < 768px', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useIsMobile(), { wrapper });
    
    expect(result.current).toBe(true);
  });

  it('should return false for viewport >= 768px', () => {
    mockUseMediaQuery.mockReturnValue(false);
    
    const { result } = renderHook(() => useIsMobile(), { wrapper });
    
    expect(result.current).toBe(false);
  });
});

describe('useIsTablet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for viewport between 768px and 1024px', () => {
    // First call (sm up) returns true, second call (md down) returns true
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useIsTablet(), { wrapper });
    
    expect(result.current).toBe(true);
  });

  it('should return false for viewport < 768px', () => {
    // First call (sm up) returns false
    mockUseMediaQuery.mockReturnValueOnce(false).mockReturnValueOnce(true);
    
    const { result } = renderHook(() => useIsTablet(), { wrapper });
    
    expect(result.current).toBe(false);
  });

  it('should return false for viewport >= 1024px', () => {
    // First call (sm up) returns true, second call (md down) returns false
    mockUseMediaQuery.mockReturnValueOnce(true).mockReturnValueOnce(false);
    
    const { result } = renderHook(() => useIsTablet(), { wrapper });
    
    expect(result.current).toBe(false);
  });
});

describe('useIsDesktop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for viewport >= 1024px', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useIsDesktop(), { wrapper });
    
    expect(result.current).toBe(true);
  });

  it('should return false for viewport < 1024px', () => {
    mockUseMediaQuery.mockReturnValue(false);
    
    const { result } = renderHook(() => useIsDesktop(), { wrapper });
    
    expect(result.current).toBe(false);
  });
});

describe('useResponsiveValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the value for the current breakpoint', () => {
    // Mock current breakpoint as 'md'
    mockUseMediaQuery.mockImplementation((query: string) => {
      return query.includes('768px') || query.includes('1024px');
    });
    
    const { result } = renderHook(
      () => useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 }),
      { wrapper }
    );
    
    expect(result.current).toBe(3);
  });

  it('should return the closest smaller breakpoint value if current is not defined', () => {
    // Mock current breakpoint as 'lg'
    mockUseMediaQuery.mockImplementation((query: string) => {
      return !query.includes('1920px');
    });
    
    const { result } = renderHook(
      () => useResponsiveValue({ xs: 1, sm: 2, md: 3 }), // lg not defined
      { wrapper }
    );
    
    expect(result.current).toBe(3); // Falls back to md
  });

  it('should return undefined if no matching breakpoint is found', () => {
    // Mock current breakpoint as 'xl'
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(
      () => useResponsiveValue({ xs: 1, sm: 2 }), // md, lg, xl not defined
      { wrapper }
    );
    
    expect(result.current).toBe(2); // Falls back to sm
  });

  it('should work with different value types', () => {
    // Mock current breakpoint as 'sm'
    mockUseMediaQuery.mockImplementation((query: string) => {
      return query.includes('768px');
    });
    
    const { result } = renderHook(
      () => useResponsiveValue({ xs: 'mobile', sm: 'tablet', md: 'desktop' }),
      { wrapper }
    );
    
    expect(result.current).toBe('tablet');
  });

  it('should return xs value for mobile viewport', () => {
    // Mock current breakpoint as 'xs'
    mockUseMediaQuery.mockReturnValue(false);
    
    const { result } = renderHook(
      () => useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 }),
      { wrapper }
    );
    
    expect(result.current).toBe(1);
  });
});
