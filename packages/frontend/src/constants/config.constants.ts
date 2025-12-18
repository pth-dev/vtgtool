/**
 * Application Configuration Constants
 */

// App Info
export const APP_NAME = 'VTGTOOL'
export const APP_VERSION = '1.0.0'

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  AUTH_STATE: 'vtg-auth',
  THEME: 'vtg-theme',
  LANGUAGE: 'vtg-lang',
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
} as const

// File Upload
export const FILE_UPLOAD = {
  ACCEPTED_TYPES: ['.csv', '.xlsx', '.xls', '.json'] as const,
  ACCEPTED_MIME_TYPES: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
  ] as const,
  MAX_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
  MAX_SIZE_DISPLAY: '100MB',
} as const

// Debounce
export const DEBOUNCE = {
  SEARCH: 300,
  CHART_PREVIEW: 500,
  AUTO_SAVE: 1000,
} as const

// Chart Colors
export const CHART_PALETTES = {
  vtg: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
  ocean: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'],
  forest: ['#166534', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
  sunset: ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'],
  purple: ['#6b21a8', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
  modern: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'],
} as const

export type ColorPaletteName = keyof typeof CHART_PALETTES

// Import Wizard Steps
export const IMPORT_WIZARD_STEPS = ['Upload File', 'Preview Data', 'Finish Import'] as const

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const
