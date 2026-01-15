/**
 * Month Picker Component
 * DatePicker configured for month/year selection only
 */
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'

import { MONTH_FORMAT, type MonthPickerProps } from '@/types'
import { getMonthPickerSlotProps } from '@/shared/utils'

export function MonthPicker({ value, range, isDark, isMobile, isDisabled, onChange }: MonthPickerProps): JSX.Element {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        views={['year', 'month']}
        openTo="month"
        format={MONTH_FORMAT}
        value={value}
        minDate={range.minDate}
        maxDate={range.maxDate}
        onChange={onChange}
        disabled={isDisabled}
        slotProps={getMonthPickerSlotProps(isDark, isMobile)}
        sx={isMobile ? { minWidth: 100, flex: 1 } : { minWidth: 120 }}
      />
    </LocalizationProvider>
  )
}
