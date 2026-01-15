/**
 * Filter Utility Functions
 */
import dayjs, { Dayjs } from 'dayjs'

import type { FilterState, MonthRange, MultiFilterKey } from '@/types'
import { MONTH_FORMAT, MULTI_FILTERS } from '@/types'

export function getMonthValue(month: string): Dayjs | null {
  if (!month) return null
  const value: Dayjs = dayjs(`${month}-01`)
  return value.isValid() ? value : null
}

export function getMonthRange(months: string[]): MonthRange {
  if (!months.length) return {}
  const sortedMonths: string[] = [...months].sort()
  const minDate: Dayjs | null = getMonthValue(sortedMonths[0])
  const maxDate: Dayjs | null = getMonthValue(sortedMonths[sortedMonths.length - 1])
  return { minDate: minDate ?? undefined, maxDate: maxDate ?? undefined }
}

export function formatMonthValue(value: Dayjs | null): string {
  if (!value) return ''
  return value.format(MONTH_FORMAT)
}

export function getMonthPickerStyles(isDark: boolean, isMobile: boolean): { fontSize: number; bgcolor: string } {
  return { fontSize: isMobile ? 13 : 14, bgcolor: isDark ? '#18181b' : 'white' }
}

export function getMonthPickerSlotProps(isDark: boolean, isMobile: boolean): {
  textField: { size: 'small'; label: string; sx: { fontSize: number; bgcolor: string } }
} {
  return { textField: { size: 'small', label: 'Month', sx: getMonthPickerStyles(isDark, isMobile) } }
}

export function getActiveFilterCount(filters: FilterState): number {
  return MULTI_FILTERS.filter((config) => filters[config.key].length > 0).length
}

export function removeFilterValue(filters: FilterState, key: MultiFilterKey, value: string): string[] {
  return filters[key].filter((item) => item !== value)
}
