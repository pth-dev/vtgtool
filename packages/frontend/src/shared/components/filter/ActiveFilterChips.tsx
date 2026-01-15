/**
 * Active Filter Chips Component
 * Displays selected filter values as removable chips
 */
import { Box, Chip } from '@mui/material'

import { MULTI_FILTERS, type ActiveFilterChipsProps } from '@/types'
import { removeFilterValue } from '@/shared/utils'

export function ActiveFilterChips({ filters, onChange }: ActiveFilterChipsProps): JSX.Element | null {
  const hasActiveFilters: boolean = MULTI_FILTERS.some((config) => filters[config.key].length > 0)
  if (!hasActiveFilters) return null
  return (
    <Box mt={2} display="flex" flexWrap="wrap" gap={0.5}>
      {MULTI_FILTERS.map((config) =>
        filters[config.key].map((value) => (
          <Chip
            key={`${config.key}-${value}`}
            label={value}
            size="small"
            onDelete={() => onChange(config.key, removeFilterValue(filters, config.key, value))}
          />
        ))
      )}
    </Box>
  )
}
