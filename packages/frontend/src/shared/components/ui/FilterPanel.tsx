import { useState } from 'react'
import { Clear, FilterAlt, Close } from '@mui/icons-material'
import {
  Badge,
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import { FilterMultiSelect } from '@/shared/components/form/FilterMultiSelect'

interface Props {
  filters: {
    month: string
    customers: string[]
    categories: string[]
    statuses: string[]
    products: string[]
  }
  options: {
    months: string[]
    customers: string[]
    categories: string[]
    statuses: string[]
    products: string[]
  }
  selectedMonth: string
  onChange: (
    key: 'month' | 'customers' | 'categories' | 'statuses' | 'products',
    value: string | string[]
  ) => void
  onClear: () => void
}

export default function FilterPanel({ filters, options, selectedMonth, onChange, onClear }: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [open, setOpen] = useState(false)

  const activeCount = [filters.customers, filters.categories, filters.statuses, filters.products].filter(
    (f) => f.length > 0
  ).length

  // Mobile: Compact bar with Month + Filter button
  if (isMobile) {
    return (
      <>
        <Box display="flex" gap={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
            <Select
              value={filters.month || selectedMonth || ''}
              onChange={(e) => onChange('month', e.target.value)}
              displayEmpty
              sx={{
                fontSize: 13,
                bgcolor: isDark ? '#18181b' : 'white',
                '& .MuiSelect-select': { py: 1 },
              }}
            >
              {options.months?.map((m) => (
                <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Badge badgeContent={activeCount} color="primary">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterAlt sx={{ fontSize: 16 }} />}
              onClick={() => setOpen(true)}
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

        {/* Bottom Sheet */}
        <Drawer
          anchor="bottom"
          open={open}
          onClose={() => setOpen(false)}
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
              <IconButton size="small" onClick={() => setOpen(false)}>
                <Close fontSize="small" />
              </IconButton>
            </Stack>

            <Stack spacing={2}>
              <FilterMultiSelect
                label="Customer"
                value={filters.customers}
                options={options.customers}
                onChange={(v) => onChange('customers', v)}
                isDark={isDark}
              />
              <FilterMultiSelect
                label="Category"
                value={filters.categories}
                options={options.categories}
                onChange={(v) => onChange('categories', v)}
                isDark={isDark}
              />
              <FilterMultiSelect
                label="Status"
                value={filters.statuses}
                options={options.statuses}
                onChange={(v) => onChange('statuses', v)}
                isDark={isDark}
              />
              <FilterMultiSelect
                label="Product"
                value={filters.products}
                options={options.products}
                onChange={(v) => onChange('products', v)}
                isDark={isDark}
              />
            </Stack>

            {/* Active filters chips */}
            {activeCount > 0 && (
              <Box mt={2} display="flex" flexWrap="wrap" gap={0.5}>
                {filters.customers.map((c) => (
                  <Chip key={c} label={c} size="small" onDelete={() => onChange('customers', filters.customers.filter(x => x !== c))} />
                ))}
                {filters.categories.map((c) => (
                  <Chip key={c} label={c} size="small" onDelete={() => onChange('categories', filters.categories.filter(x => x !== c))} />
                ))}
                {filters.statuses.map((s) => (
                  <Chip key={s} label={s} size="small" onDelete={() => onChange('statuses', filters.statuses.filter(x => x !== s))} />
                ))}
                {filters.products.map((p) => (
                  <Chip key={p} label={p} size="small" onDelete={() => onChange('products', filters.products.filter(x => x !== p))} />
                ))}
              </Box>
            )}

            <Stack direction="row" spacing={1} mt={3}>
              {activeCount > 0 && (
                <Button variant="outlined" fullWidth onClick={onClear}>
                  Clear All
                </Button>
              )}
              <Button variant="contained" fullWidth onClick={() => setOpen(false)}>
                Apply
              </Button>
            </Stack>
          </Box>
        </Drawer>
      </>
    )
  }

  // Desktop: Full inline filter
  return (
    <Paper
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 14 }}>Month</InputLabel>
            <Select
              value={filters.month || selectedMonth || ''}
              onChange={(e) => onChange('month', e.target.value)}
              input={<OutlinedInput label="Month" />}
              sx={{ fontSize: 14, bgcolor: isDark ? '#18181b' : 'white' }}
            >
              {options.months?.map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FilterMultiSelect label="Customer" value={filters.customers} options={options.customers} onChange={(v) => onChange('customers', v)} isDark={isDark} />
          <FilterMultiSelect label="Category" value={filters.categories} options={options.categories} onChange={(v) => onChange('categories', v)} isDark={isDark} />
          <FilterMultiSelect label="Status" value={filters.statuses} options={options.statuses} onChange={(v) => onChange('statuses', v)} isDark={isDark} />
          <FilterMultiSelect label="Product" value={filters.products} options={options.products} onChange={(v) => onChange('products', v)} isDark={isDark} />
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
