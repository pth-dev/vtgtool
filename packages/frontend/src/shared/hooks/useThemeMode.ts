import { useTheme } from '@mui/material'

// Hook for theme mode utilities - provides isDark flag and common theme colors

/**
 * Hook for theme mode utilities
 * Provides isDark flag and common theme colors
 */
export function useThemeMode() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return {
    isDark,
    theme,
    colors: {
      // Backgrounds
      paper: isDark ? '#0c0c0c' : 'background.paper',
      paperMuted: isDark ? '#0c0c0c' : '#f8fafc',
      input: isDark ? '#18181b' : 'white',
      overlay: isDark ? 'rgba(9,9,11,0.7)' : 'rgba(255,255,255,0.7)',
      // Borders
      border: isDark ? '#27272a' : '#e2e8f0',
      borderHover: isDark ? '#3f3f46' : '#cbd5e1',
      // Text
      textMuted: isDark ? '#a1a1aa' : '#71717a',
      // Accents
      primary: theme.palette.primary.main,
      success: isDark ? '#22c55e' : theme.palette.success.main,
      error: isDark ? '#ef4444' : theme.palette.error.main,
    },
    // Common sx utilities
    sx: {
      inputRoot: {
        bgcolor: isDark ? '#18181b' : 'white',
        borderRadius: 1.5,
        '& fieldset': { borderColor: isDark ? '#27272a' : '#e2e8f0' },
        '&:hover fieldset': { borderColor: isDark ? '#3f3f46' : '#cbd5e1' },
      },
      paperElevated: {
        bgcolor: isDark ? '#0c0c0c' : 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      },
    },
  }
}
