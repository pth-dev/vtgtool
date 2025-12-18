import { useCallback, useEffect, useRef, useState } from 'react'

import { Box, useTheme } from '@mui/material'

import { ApexOptions } from 'apexcharts'
import Chart from 'react-apexcharts'

import { useChartTheme } from '@/features/dashboard/hooks/useChartTheme'
import { ChartContextMenu } from '@/shared/components/ui/ChartContextMenu'

interface DataItem {
  name: string
  count?: number
  value?: number
  percent?: number
}

interface Props {
  data: DataItem[]
  color?: string
  horizontal?: boolean
  height?: number
  onClick?: (name: string) => void
  onShowData?: (name: string) => void
  selected?: string
}

export default function BarChart({
  data,
  color,
  horizontal = true,
  height = 280,
  onClick,
  onShowData,
  selected,
}: Props) {
  const theme = useTheme()
  const chartTheme = useChartTheme()
  const isDark = theme.palette.mode === 'dark'
  const chartRef = useRef<HTMLDivElement>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: { top: number; left: number }
    dataIndex: number
  } | null>(null)

  const defaultColor = isDark ? '#60a5fa' : '#3b82f6'
  const barColor = color || defaultColor
  const values = data.map((d) => d.count ?? d.value ?? 0)
  const colors = data.map((d) =>
    d.name === selected ? barColor : selected ? `${barColor}40` : barColor
  )

  // Calculate max label length for dynamic padding
  const maxLabelLength = Math.max(...data.map((d) => d.name.length), 1)
  const yAxisWidth = Math.min(Math.max(maxLabelLength * 7, 100), 200)

  // Calculate data index from mouse position
  const getDataIndexFromPosition = useCallback(
    (clientY: number): number | null => {
      const chartElement = chartRef.current
      if (!chartElement) return null

      const rect = chartElement.getBoundingClientRect()
      const y = clientY - rect.top
      const chartAreaTop = 40
      const chartAreaHeight = rect.height - chartAreaTop - 30
      const adjustedY = y - chartAreaTop

      if (adjustedY < 0 || adjustedY > chartAreaHeight) return null

      const barHeight = chartAreaHeight / data.length
      const dataIndex = Math.floor(adjustedY / barHeight)

      return dataIndex >= 0 && dataIndex < data.length ? dataIndex : null
    },
    [data.length]
  )

  // Handle right-click on chart
  const handleContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      if (!onShowData) return

      event.preventDefault()
      event.stopPropagation()

      const dataIndex = getDataIndexFromPosition(event.clientY)

      if (dataIndex !== null) {
        setContextMenu({
          position: { top: event.clientY, left: event.clientX },
          dataIndex,
        })
      }
    },
    [getDataIndexFromPosition, onShowData]
  )

  // Prevent default browser context menu on chart element
  useEffect(() => {
    const chartElement = chartRef.current
    if (!chartElement || !onShowData) return

    const handler = (e: MouseEvent) => {
      e.preventDefault()
      handleContextMenu(e)
    }

    chartElement.addEventListener('contextmenu', handler, { capture: true })
    return () => chartElement.removeEventListener('contextmenu', handler, { capture: true })
  }, [handleContextMenu, onShowData])

  // Also prevent on document level when menu is open
  useEffect(() => {
    if (!contextMenu) return

    const handler = (e: MouseEvent) => {
      // Check if click is on chart area - if so, update menu position
      const chartElement = chartRef.current
      if (chartElement && chartElement.contains(e.target as Node)) {
        e.preventDefault()
        const dataIndex = getDataIndexFromPosition(e.clientY)
        if (dataIndex !== null) {
          setContextMenu({
            position: { top: e.clientY, left: e.clientX },
            dataIndex,
          })
        }
      }
    }

    document.addEventListener('contextmenu', handler, { capture: true })
    return () => document.removeEventListener('contextmenu', handler, { capture: true })
  }, [contextMenu, getDataIndexFromPosition])

  const handleCloseContextMenu = () => setContextMenu(null)

  const handleShowData = () => {
    if (contextMenu && onShowData) {
      onShowData(data[contextMenu.dataIndex].name)
    }
    handleCloseContextMenu()
  }

  const handleFilter = () => {
    if (contextMenu && onClick) {
      onClick(data[contextMenu.dataIndex].name)
    }
    handleCloseContextMenu()
  }

  const options: ApexOptions = {
    ...chartTheme,
    chart: {
      ...chartTheme.chart,
      type: 'bar',
      toolbar: { show: false },
      events: onClick
        ? {
            dataPointSelection: (event, _, config) => {
              if (event && (event as MouseEvent).button === 2) return
              onClick(data[config.dataPointIndex].name)
            },
          }
        : undefined,
    },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 4,
        distributed: true,
        dataLabels: { position: 'top' },
        barHeight: '70%',
      },
    },
    xaxis: {
      ...chartTheme.xaxis,
      categories: data.map((d) => d.name),
      labels: {
        ...chartTheme.xaxis?.labels,
        style: { fontSize: '12px', colors: isDark ? '#a1a1aa' : '#71717a' },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px', colors: [isDark ? '#a1a1aa' : '#71717a'] },
        maxWidth: yAxisWidth,
        formatter: (val: string | number) => {
          const str = String(val)
          return str.length > 20 ? str.substring(0, 20) + '...' : str
        },
      },
    },
    colors,
    legend: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (val, opt) => {
        const percent = data[opt.dataPointIndex].percent
        return percent !== undefined ? `${percent}%` : `${val}`
      },
      offsetX: horizontal ? 30 : 0,
      offsetY: horizontal ? 0 : -20,
      style: { fontSize: '12px', colors: [isDark ? '#a1a1aa' : '#374151'] },
    },
    tooltip: {
      ...chartTheme.tooltip,
      y: { formatter: (val) => `${val.toLocaleString()} orders` },
    },
    grid: {
      ...chartTheme.grid,
      padding: { left: 10, right: 10 },
    },
  }

  return (
    <Box ref={chartRef} sx={{ position: 'relative', height: '100%', minHeight: height }}>
      <Chart type="bar" options={options} series={[{ data: values }]} height="100%" />

      <ChartContextMenu
        anchorPosition={contextMenu?.position || null}
        data={contextMenu ? data[contextMenu.dataIndex] : null}
        onShowData={onShowData ? handleShowData : undefined}
        onFilter={onClick ? handleFilter : undefined}
        onClose={handleCloseContextMenu}
      />
    </Box>
  )
}
