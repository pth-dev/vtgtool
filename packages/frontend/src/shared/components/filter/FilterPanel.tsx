/**
 * Filter Panel Component
 * Main filter panel with responsive layout (mobile/desktop)
 */
import { useState } from 'react'

import { useMediaQuery, useTheme } from '@mui/material'

import { DesktopFilterPanel } from './DesktopFilterPanel'
import { MobileFilterBar } from './MobileFilterBar'
import { MobileFilterDrawer } from './MobileFilterDrawer'
import { MonthPicker } from './MonthPicker'
import type { FilterPanelProps } from '@/types'
import { formatMonthValue, getActiveFilterCount, getMonthRange, getMonthValue } from '@/shared/utils'

export function FilterPanel({ filters, options, selectedMonth, onChange, onClear }: FilterPanelProps): JSX.Element {
  const theme = useTheme()
  const isDark: boolean = theme.palette.mode === 'dark'
  const isMobile: boolean = useMediaQuery(theme.breakpoints.down('sm'))
  const [open, setOpen] = useState(false)
  const monthRange = getMonthRange(options.months)
  const monthValue = getMonthValue(filters.month || selectedMonth)
  const activeCount = getActiveFilterCount(filters)
  const monthPicker = (
    <MonthPicker
      value={monthValue}
      range={monthRange}
      isDark={isDark}
      isMobile={isMobile}
      isDisabled={!options.months.length}
      onChange={(value) => onChange('month', formatMonthValue(value))}
    />
  )
  if (isMobile) {
    return (
      <>
        <MobileFilterBar
          monthPicker={monthPicker}
          activeCount={activeCount}
          isDark={isDark}
          onOpen={() => setOpen(true)}
        />
        <MobileFilterDrawer
          open={open}
          isDark={isDark}
          activeCount={activeCount}
          filters={filters}
          options={options}
          onChange={onChange}
          onClear={onClear}
          onClose={() => setOpen(false)}
        />
      </>
    )
  }
  return (
    <DesktopFilterPanel
      monthPicker={monthPicker}
      activeCount={activeCount}
      isDark={isDark}
      filters={filters}
      options={options}
      onChange={onChange}
      onClear={onClear}
    />
  )
}
