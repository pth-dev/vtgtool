import { ReactNode } from 'react'

import { Box, Typography } from '@mui/material'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
  compact?: boolean
}

export default function PageHeader({ title, subtitle, action, compact }: Props) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={compact ? 0 : 3}>
      <Box>
        <Typography variant={compact ? 'subtitle1' : 'h5'} fontWeight={600} lineHeight={1.2}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  )
}
