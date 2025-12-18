import type { PaletteOptions } from '@mui/material/styles'

const grey = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
}

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: { main: '#1e40af', light: '#3b82f6', dark: '#1e3a8a' },
  secondary: { main: '#7c3aed' },
  background: { default: '#f8fafc', paper: '#ffffff' },
  grey,
}

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: { main: '#3b82f6', light: '#60a5fa', dark: '#1e40af' },
  secondary: { main: '#8b5cf6', light: '#a78bfa', dark: '#6d28d9' },
  error: { main: '#ef4444' },
  warning: { main: '#f59e0b' },
  success: { main: '#22c55e' },
  background: { default: '#0a0a0a', paper: '#171717' },
  text: { primary: '#fafafa', secondary: '#a1a1aa' },
  divider: '#27272a',
  grey,
}
