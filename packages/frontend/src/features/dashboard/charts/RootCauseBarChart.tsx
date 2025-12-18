import { useEffect, useRef } from 'react'
import { Box, useTheme } from '@mui/material'
import { ApexOptions } from 'apexcharts'
import Chart from 'react-apexcharts'
import { useChartTheme } from '@/features/dashboard/hooks/useChartTheme'

interface RootCauseItem {
  root_cause: string
  count: number
  percent: number
}

interface Props {
  data: RootCauseItem[]
  height: number
  onSelect: (name: string) => void
}

export function RootCauseBarChart({ data, height, onSelect }: Props) {
  const theme = useTheme()
  const chartTheme = useChartTheme()
  const isDark = theme.palette.mode === 'dark'
  const chartRef = useRef<HTMLDivElement>(null)

  // Add native SVG title tooltips
  useEffect(() => {
    if (!chartRef.current) return
    const timer = setTimeout(() => {
      chartRef.current?.querySelectorAll('.apexcharts-xaxis-label').forEach((el, i) => {
        const idx = data.length - 1 - i
        if (data[idx] && !el.querySelector('title')) {
          const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
          title.textContent = data[idx].root_cause
          el.appendChild(title)
        }
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [data])

  const options: ApexOptions = {
    ...chartTheme,
    chart: {
      ...chartTheme.chart,
      type: 'bar',
      toolbar: { show: false },
      events: {
        dataPointSelection: (_, __, config) => onSelect(data[config.dataPointIndex].root_cause),
      },
    },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '65%' } },
    colors: ['#ef4444'],
    xaxis: {
      ...chartTheme.xaxis,
      categories: data.map((d) => d.root_cause),
      labels: {
        formatter: (val: string) => (val.length > 35 ? val.slice(0, 35) + '...' : val),
        style: { fontSize: '11px', colors: [isDark ? '#a1a1aa' : '#71717a'] },
      },
    },
    yaxis: {
      labels: { style: { fontSize: '11px', colors: [isDark ? '#a1a1aa' : '#71717a'] }, maxWidth: 280 },
    },
    dataLabels: {
      enabled: true,
      formatter: (_, opt) => `${data[opt.dataPointIndex].percent}%`,
      offsetX: 25,
      style: { fontSize: '11px', colors: [isDark ? '#e5e5e5' : '#374151'] },
    },
    tooltip: {
      ...chartTheme.tooltip,
      custom: ({ dataPointIndex }) => {
        const item = data[dataPointIndex]
        return item
          ? `<div style="padding:8px 12px;max-width:300px;">
              <div style="font-weight:600;margin-bottom:4px;">${item.root_cause}</div>
              <div>Count: ${item.count.toLocaleString()}</div>
              <div>Percent: ${item.percent}%</div>
            </div>`
          : ''
      },
    },
  }

  return (
    <Box ref={chartRef} sx={{ height, '& .apexcharts-yaxis-label': { cursor: 'pointer' } }}>
      <Chart type="bar" options={options} series={[{ data: data.map((d) => d.count) }]} height="100%" />
    </Box>
  )
}
