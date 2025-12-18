import { Box } from '@mui/material'
import { ApexOptions } from 'apexcharts'
import Chart from 'react-apexcharts'
import { useChartTheme } from '@/features/dashboard/hooks/useChartTheme'

interface SeriesData {
  name: string
  data: { month: string; count: number }[]
}

interface Props {
  data: SeriesData[]
  height?: number
  colors?: string[]
}

export function GroupedBarChart({ data, height = 300, colors }: Props) {
  const chartTheme = useChartTheme()

  if (!data.length) return null

  const categories = data[0]?.data.map((d) => d.month) || []
  const series = data.map((s) => ({
    name: s.name,
    data: s.data.map((d) => d.count),
  }))

  const defaultColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981']

  const options: ApexOptions = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'bar', toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '70%', borderRadius: 3 },
    },
    xaxis: { ...chartTheme.xaxis, categories },
    colors: colors || defaultColors,
    legend: { position: 'top', horizontalAlign: 'left' },
    dataLabels: { enabled: false },
    tooltip: {
      ...chartTheme.tooltip,
      y: { formatter: (val) => `${val.toLocaleString()} failures` },
    },
  }

  return (
    <Box sx={{ height }}>
      <Chart type="bar" options={options} series={series} height="100%" />
    </Box>
  )
}
