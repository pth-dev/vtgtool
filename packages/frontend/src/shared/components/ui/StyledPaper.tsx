import { Paper, PaperProps } from '@mui/material'

import { useThemeMode } from '@/shared/hooks'

type PaperVariant = 'default' | 'muted'

interface StyledPaperProps extends Omit<PaperProps, 'variant'> {
  variant?: PaperVariant
}

/**
 * Styled Paper component with theme-aware backgrounds
 */
export function StyledPaper({ variant = 'default', children, sx, ...props }: StyledPaperProps) {
  const { colors } = useThemeMode()

  const bgMap: Record<PaperVariant, string> = {
    default: colors.paper,
    muted: colors.paperMuted,
  }

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: bgMap[variant],
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  )
}
