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

export function HeatmapChart({ data, height = 280 }: Props) {
  const chartTheme = useChartTheme()

  if (!data.length) return null

  const months = data[0]?.data.map((d) => d.month) || []
  
  // Sort by total failures descending
  const sortedData = [...data].sort((a, b) => {
    const totalA = a.data.reduce((sum, d) => sum + d.count, 0)
    const totalB = b.data.reduce((sum, d) => sum + d.count, 0)
    return totalB - totalA
  })

  const series = sortedData.map((s) => ({
    name: s.name,
    data: s.data.map((d) => ({ x: d.month, y: d.count })),
  }))

  // Dynamic height: 35px per row, min 280px
  const dynamicHeight = Math.max(height, sortedData.length * 35 + 50)

  const options: ApexOptions = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'heatmap', toolbar: { show: false } },
    dataLabels: { enabled: true, style: { fontSize: '11px' } },
    xaxis: { categories: months, labels: { style: { fontSize: '11px' } } },
    plotOptions: {
      heatmap: {
        colorScale: {
          ranges: [
            { from: 0, to: 20, color: '#10b981', name: 'Low' },
            { from: 21, to: 40, color: '#f59e0b', name: 'Medium' },
            { from: 41, to: 1000, color: '#ef4444', name: 'High' },
          ],
        },
      },
    },
    legend: { show: false },
    tooltip: {
      ...chartTheme.tooltip,
      y: { formatter: (val) => `${val} orders` },
    },
  }

  return (
    <Box sx={{ height: dynamicHeight }}>
      <Chart type="heatmap" options={options} series={series} height="100%" />
    </Box>
  )
}
