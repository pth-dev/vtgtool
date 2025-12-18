import { Box, Typography, useTheme } from '@mui/material'
import { ApexOptions } from 'apexcharts'
import Chart from 'react-apexcharts'
import { useChartTheme } from '@/features/dashboard/hooks/useChartTheme'

interface MonthlyData {
  label: string
  lock: number
  hold: number
  failure: number
}

interface MonthlyVolumeChartProps {
  data: MonthlyData[]
  height?: number
}

export function MonthlyVolumeChart({ data, height = 300 }: MonthlyVolumeChartProps) {
  const theme = useTheme()
  const chartTheme = useChartTheme()
  const isDark = theme.palette.mode === 'dark'

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    )
  }

  const options: ApexOptions = {
    ...chartTheme,
    chart: {
      ...chartTheme.chart,
      type: 'bar',
      stacked: true,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
      },
    },
    xaxis: {
      ...chartTheme.xaxis,
      categories: data.map(d => d.label),
      labels: {
        style: {
          fontSize: '11px',
          colors: isDark ? '#a1a1aa' : '#71717a',
        },
      },
    },
    yaxis: {
      ...chartTheme.yaxis,
      title: {
        text: 'Orders',
        style: { fontSize: '12px', color: isDark ? '#a1a1aa' : '#71717a' },
      },
    },
    colors: ['#8b5cf6', '#f59e0b', '#ef4444'],
    legend: {
      ...chartTheme.legend,
      position: 'top',
    },
    dataLabels: {
      enabled: false,
    },
  }

  const series = [
    { name: 'Lock', data: data.map(d => d.lock) },
    { name: 'Hold', data: data.map(d => d.hold) },
    { name: 'Failure', data: data.map(d => d.failure) },
  ]

  return <Chart type="bar" options={options} series={series} height={height} />
}
