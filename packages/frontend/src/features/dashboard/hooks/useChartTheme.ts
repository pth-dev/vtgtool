import { useTheme } from '@mui/material'
import type { ApexOptions } from 'apexcharts'

export function useChartTheme(): ApexOptions {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return {
    chart: {
      background: 'transparent',
      foreColor: isDark ? '#a1a1aa' : '#71717a',
      toolbar: { show: false },
    },
    xaxis: {
      labels: {
        style: { colors: isDark ? '#a1a1aa' : '#71717a' },
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
    },
    grid: {
      borderColor: isDark ? '#27272a' : '#e4e4e7',
    },
    legend: {
      labels: { colors: isDark ? '#a1a1aa' : '#71717a' },
    },
  }
}
