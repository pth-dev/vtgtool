import { Box, CircularProgress, Typography } from '@mui/material'

import { useThemeMode } from '@/shared/hooks'

interface LoadingOverlayProps {
  show: boolean
  text?: string
  size?: number
}

/**
 * Loading overlay component
 * Displays a centered spinner over content
 */
export function LoadingOverlay({ show, text, size = 32 }: LoadingOverlayProps) {
  const { colors } = useThemeMode()

  if (!show) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        bgcolor: colors.overlay,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        borderRadius: 2,
      }}
    >
      <CircularProgress size={size} />
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
    </Box>
  )
}
