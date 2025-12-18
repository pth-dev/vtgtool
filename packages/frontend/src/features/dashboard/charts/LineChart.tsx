import { useTheme } from '@mui/material'

import { ApexOptions } from 'apexcharts'
import Chart from 'react-apexcharts'

import { useChartTheme } from '@/features/dashboard/hooks/useChartTheme'

const chartColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

interface Props {
  data: Record<string, unknown>[]
  xKey: string
  series: { key: string; name: string; color?: string }[]
  height?: number
}

export default function LineChart({ data, xKey, series, height = 320 }: Props) {
  const theme = useTheme()
  const chartTheme = useChartTheme()
  const isDark = theme.palette.mode === 'dark'

  const colors = series.map((s, i) => s.color || chartColors[i % chartColors.length])

  const options: ApexOptions = {
    ...chartTheme,
    chart: {
      ...chartTheme.chart,
      type: 'line',
    },
    xaxis: {
      ...chartTheme.xaxis,
      categories: data.map((d) => String(d[xKey] ?? '')),
      labels: {
        rotate: -45,
        style: {
          fontSize: '10px',
          colors: isDark ? '#a1a1aa' : '#71717a',
        },
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    colors,
    legend: {
      ...chartTheme.legend,
      position: 'top',
    },
    markers: {
      size: 4,
      strokeWidth: 0,
      hover: {
        size: 6,
      },
    },
  }

  const chartSeries = series.map((s) => ({
    name: s.name,
    data: data.map((d) => Number(d[s.key]) || 0),
  }))

  return <Chart type="line" options={options} series={chartSeries} height={height} />
}
