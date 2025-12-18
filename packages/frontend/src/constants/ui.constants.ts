/**
 * UI Constants
 * Layout, breakpoints, animation, and styling constants
 */

// Layout
export const LAYOUT = {
  DRAWER_WIDTH: 240,
  DRAWER_COLLAPSED_WIDTH: 72,
  HEADER_HEIGHT: 64,
  MOBILE_HEADER_HEIGHT: 56,
} as const

// Breakpoints (matches MUI defaults)
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
} as const

// Animation
export const ANIMATION = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.6, 1)',
    SPRING: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const

// Z-Index
export const Z_INDEX = {
  DRAWER: 1200,
  MODAL: 1300,
  POPOVER: 1400,
  TOOLTIP: 1500,
  SNACKBAR: 1600,
} as const

// Spacing (in pixels, base 8)
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
} as const

// Border Radius
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: '50%',
} as const

// Chart Dimensions
export const CHART = {
  DEFAULT_HEIGHT: 280,
  MIN_HEIGHT: 200,
  MAX_HEIGHT: 600,
  MOBILE_HEIGHT: 220,
} as const

// Table
export const TABLE = {
  DEFAULT_ROW_HEIGHT: 52,
  DENSE_ROW_HEIGHT: 36,
  MIN_COLUMN_WIDTH: 100,
} as const

// Input
export const INPUT = {
  MAX_LENGTH: {
    NAME: 100,
    DESCRIPTION: 500,
    EMAIL: 255,
    PASSWORD: 128,
  },
} as const

// Notification
export const NOTIFICATION = {
  AUTO_HIDE_DURATION: {
    SUCCESS: 4000,
    ERROR: 6000,
    INFO: 5000,
    WARNING: 5000,
  },
} as const

// Theme Colors
export const THEME_COLORS = {
  LIGHT: {
    PAPER: '#ffffff',
    PAPER_MUTED: '#f8fafc',
    INPUT: '#ffffff',
    OVERLAY: 'rgba(255,255,255,0.7)',
    BORDER: '#e2e8f0',
    BORDER_HOVER: '#cbd5e1',
    TEXT_MUTED: '#71717a',
  },
  DARK: {
    PAPER: '#0c0c0c',
    PAPER_MUTED: '#0c0c0c',
    INPUT: '#18181b',
    OVERLAY: 'rgba(9,9,11,0.7)',
    BORDER: '#27272a',
    BORDER_HOVER: '#3f3f46',
    TEXT_MUTED: '#a1a1aa',
  },
} as const
