/**
 * Mobile Filter Drawer Component
 * Bottom sheet drawer for mobile filter selection
 */
import { Close } from '@mui/icons-material'
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material'

import { ActiveFilterChips } from './ActiveFilterChips'
import { FilterSelectors } from './FilterSelectors'
import type { MobileFilterDrawerProps } from '@/types'

export function MobileFilterDrawer({
  open,
  isDark,
  activeCount,
  filters,
  options,
  onChange,
  onClear,
  onClose,
}: MobileFilterDrawerProps): JSX.Element {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '70vh',
          bgcolor: isDark ? '#09090b' : '#fff',
        },
      }}
    >
      <Box p={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={600}>Filters</Typography>
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
        <Stack spacing={2}>
          <FilterSelectors
            filters={filters}
            options={options}
            onChange={onChange}
            isDark={isDark}
            isMobile
          />
        </Stack>
        <ActiveFilterChips filters={filters} onChange={onChange} />
        <Stack direction="row" spacing={1} mt={3}>
          {activeCount > 0 && (
            <Button variant="outlined" fullWidth onClick={onClear}>
              Clear All
            </Button>
          )}
          <Button variant="contained" fullWidth onClick={onClose}>
            Apply
          </Button>
        </Stack>
      </Box>
    </Drawer>
  )
}
