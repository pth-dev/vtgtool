/**
 * Desktop Filter Panel Component
 * Full inline filter panel for desktop view
 */
import { Clear, FilterAlt } from '@mui/icons-material'
import { Box, Button, Paper, Typography } from '@mui/material'

import { FilterSelectors } from './FilterSelectors'
import type { DesktopFilterPanelProps } from '@/types'

export function DesktopFilterPanel({
  monthPicker,
  activeCount,
  isDark,
  filters,
  options,
  onChange,
  onClear,
}: DesktopFilterPanelProps): JSX.Element {
  return (
    <Paper
      data-tour-id="filter-panel"
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        bgcolor: isDark ? '#0c0c0c' : '#f8fafc',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Box display="flex" gap={2} alignItems="center">
        <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
          <FilterAlt sx={{ fontSize: 20 }} />
          <Typography fontWeight={500} fontSize={14}>Filters</Typography>
          {activeCount > 0 && (
            <Box
              component="span"
              sx={{
                bgcolor: 'primary.main',
                color: isDark ? '#09090b' : 'white',
                px: 0.75,
                py: 0.125,
                borderRadius: 10,
                fontSize: 12,
              }}
            >
              {activeCount}
            </Box>
          )}
        </Box>
        <Box display="flex" gap={1.5} flexWrap="wrap" flex={1}>
          {monthPicker}
          <FilterSelectors
            filters={filters}
            options={options}
            onChange={onChange}
            isDark={isDark}
            isMobile={false}
          />
        </Box>
        {activeCount > 0 && (
          <Button size="small" startIcon={<Clear />} onClick={onClear} sx={{ color: 'text.secondary' }}>
            Clear
          </Button>
        )}
      </Box>
    </Paper>
  )
}
