/**
 * Color constants for the application
 * Centralized color management for easy theming
 */

// Status Bar Colors
export const STATUS_BAR_COLORS = {
  light: {
    backgroundColor: '#FFFFFF',
    barStyle: 'dark-content' as const, // dark text/icons on light background
  },
  dark: {
    backgroundColor: '#1F2937',
    barStyle: 'light-content' as const, // light text/icons on dark background
  },
  purple: {
    backgroundColor: '#5B18B8',
    barStyle: 'light-content' as const,
  },
  transparent: {
    backgroundColor: 'transparent',
    barStyle: 'dark-content' as const,
  },
};

// Navigation Bar Colors (Android)
export const NAVIGATION_BAR_COLORS = {
  light: '#FFFFFF',
  dark: '#1F2937',
  purple: '#5B18B8',
};

// App Theme Colors
export const COLORS = {
  primary: '#5B18B8',
  secondary: '#9CA3AF',
  background: '#F9FAFB',
  white: '#FFFFFF',
  black: '#1F2937',
  gray: '#6B7280',
};

