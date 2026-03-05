import { useTheme as useMuiTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Breakpoint } from '@mui/material/styles';

/**
 * Hook to check if the current viewport matches a specific breakpoint
 * 
 * @param breakpoint - The breakpoint to check ('xs', 'sm', 'md', 'lg', 'xl')
 * @param direction - Direction to check ('up', 'down', 'only')
 * @returns True if the viewport matches the breakpoint condition
 * 
 * @example
 * const isMobile = useBreakpoint('sm', 'down'); // true if viewport <= 768px
 * const isDesktop = useBreakpoint('md', 'up'); // true if viewport >= 1024px
 * const isTablet = useBreakpoint('sm', 'only'); // true if 768px <= viewport < 1024px
 */
export function useBreakpoint(
  breakpoint: Breakpoint,
  direction: 'up' | 'down' | 'only' = 'up'
): boolean {
  const theme = useMuiTheme();
  
  let query: string;
  switch (direction) {
    case 'up':
      query = theme.breakpoints.up(breakpoint);
      break;
    case 'down':
      query = theme.breakpoints.down(breakpoint);
      break;
    case 'only':
      query = theme.breakpoints.only(breakpoint);
      break;
  }
  
  return useMediaQuery(query);
}

/**
 * Hook to get the current breakpoint name
 * Returns the largest breakpoint that matches the current viewport
 * 
 * @returns Current breakpoint name ('xs', 'sm', 'md', 'lg', 'xl')
 * 
 * @example
 * const breakpoint = useCurrentBreakpoint();
 * // Returns 'xs' for mobile, 'sm' for tablet, 'md' for small desktop, etc.
 */
export function useCurrentBreakpoint(): Breakpoint {
  const isXl = useBreakpoint('xl', 'up');
  const isLg = useBreakpoint('lg', 'up');
  const isMd = useBreakpoint('md', 'up');
  const isSm = useBreakpoint('sm', 'up');
  
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}

/**
 * Hook to check if the viewport is mobile size
 * Mobile is defined as viewport width < 768px
 * 
 * @returns True if viewport is mobile size
 * 
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   // Show mobile layout
 * }
 */
export function useIsMobile(): boolean {
  return useBreakpoint('sm', 'down');
}

/**
 * Hook to check if the viewport is tablet size
 * Tablet is defined as 768px <= viewport width < 1024px
 * 
 * @returns True if viewport is tablet size
 * 
 * @example
 * const isTablet = useIsTablet();
 * if (isTablet) {
 *   // Show tablet layout
 * }
 */
export function useIsTablet(): boolean {
  const isSm = useBreakpoint('sm', 'up');
  const isMd = useBreakpoint('md', 'down');
  return isSm && isMd;
}

/**
 * Hook to check if the viewport is desktop size
 * Desktop is defined as viewport width >= 1024px
 * 
 * @returns True if viewport is desktop size
 * 
 * @example
 * const isDesktop = useIsDesktop();
 * if (isDesktop) {
 *   // Show desktop layout
 * }
 */
export function useIsDesktop(): boolean {
  return useBreakpoint('md', 'up');
}

/**
 * Hook to get responsive values based on current breakpoint
 * Returns the appropriate value for the current viewport size
 * 
 * @param values - Object mapping breakpoints to values
 * @returns The value for the current breakpoint
 * 
 * @example
 * const columns = useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 });
 * // Returns 1 on mobile, 2 on tablet, 3 on small desktop, 4 on large desktop
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const breakpoint = useCurrentBreakpoint();
  
  // Find the value for the current breakpoint or the closest smaller one
  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpoints.indexOf(breakpoint);
  
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
}
