/**
 * Mobile Filter Bar Component
 * Compact filter bar with month picker and filter button for mobile
 */
import { FilterAlt } from '@mui/icons-material'
import { Badge, Box, Button } from '@mui/material'

import type { MobileFilterBarProps } from '@/types'

export function MobileFilterBar({ monthPicker, activeCount, isDark, onOpen }: MobileFilterBarProps): JSX.Element {
  return (
    <Box display="flex" gap={1} alignItems="center">
      {monthPicker}
      <Badge badgeContent={activeCount} color="primary">
        <Button
          variant="outlined"
          size="small"
          startIcon={<FilterAlt sx={{ fontSize: 16 }} />}
          onClick={onOpen}
          sx={{
            fontSize: 13,
            py: 0.875,
            borderColor: activeCount > 0 ? 'primary.main' : 'divider',
            bgcolor: activeCount > 0 ? (isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff') : 'transparent',
          }}
        >
          Filter
        </Button>
      </Badge>
    </Box>
  )
}
