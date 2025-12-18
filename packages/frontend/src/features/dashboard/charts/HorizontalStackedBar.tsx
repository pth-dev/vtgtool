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
}

export function HorizontalStackedBar({ data, height = 280 }: Props) {
  const chartTheme = useChartTheme()

  if (!data.length) return null

  const months = data[0]?.data.map((d) => d.month) || []
  
  const sortedData = [...data].sort((a, b) => {
    const totalA = a.data.reduce((sum, d) => sum + d.count, 0)
    const totalB = b.data.reduce((sum, d) => sum + d.count, 0)
    return totalB - totalA
  })

  const categories = sortedData.map((s) => s.name)
  
  const series = months.map((month, idx) => ({
    name: month,
    data: sortedData.map((s) => s.data[idx]?.count || 0),
  }))

  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899']

  const options: ApexOptions = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'bar', stacked: true, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: true, barHeight: '60%', borderRadius: 4 },
    },
    xaxis: { 
      ...chartTheme.xaxis,
      categories: categories,
    },
    yaxis: { 
      labels: { style: { fontSize: '12px' } },
    },
    colors: colors.slice(0, months.length),
    legend: { position: 'top', horizontalAlign: 'right' },
    dataLabels: { enabled: false },
    tooltip: {
      ...chartTheme.tooltip,
      y: { formatter: (val) => `${val} failures` },
    },
  }

  return (
    <Box sx={{ height }}>
      <Chart type="bar" options={options} series={series} height="100%" />
    </Box>
  )
}
