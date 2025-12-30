import { useMemo } from 'react'
import { useTheme } from '@mui/material'

// Import only required ECharts modules for smaller bundle
import * as echarts from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import ReactEChartsCore from 'echarts-for-react/lib/core'

// Register only what we need
echarts.use([TreemapChart, TooltipComponent, CanvasRenderer])

interface TreemapItem {
  x: string
  y: number
  percent: number
  hasChildren?: boolean
}

interface Props {
  data: TreemapItem[]
  height: number
  onItemClick?: (name: string) => void
}

export function EChartsTreemap({ data, height, onItemClick }: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const option = useMemo(() => ({
    tooltip: {
      formatter: (info: { name: string; value: number; data: TreemapItem }) => {
        return `<div style="padding:4px 8px;">
          <div style="font-weight:600;margin-bottom:4px;">${info.data.x}</div>
          <div>Count: ${info.value.toLocaleString()}</div>
          <div>Percent: ${info.data.percent}%</div>
          ${info.data.hasChildren ? '<div style="color:#888;font-size:11px;margin-top:4px;">Click to drill down</div>' : ''}
        </div>`
      },
    },
    series: [
      {
        type: 'treemap',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: (params: { data: TreemapItem }) => {
            const name = params.data.x
            const displayName = name.length > 40 ? name.slice(0, 40) + '...' : name
            return `${displayName}\n${params.data.percent}%`
          },
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowBlur: 2,
          align: 'center',
          verticalAlign: 'middle',
          overflow: 'truncate',
          ellipsis: '...',
        },
        upperLabel: { show: false },
        itemStyle: {
          borderColor: isDark ? '#222' : '#fff',
          borderWidth: 2,
          gapWidth: 2,
        },
        data: data.map((item, i) => ({
          name: item.x,
          value: item.y,
          x: item.x,
          percent: item.percent,
          hasChildren: item.hasChildren,
          itemStyle: {
            color: ['#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#06b6d4', '#84cc16'][i % 8],
          },
        })),
      },
    ],
  }), [data, isDark])

  const onEvents = useMemo(() => ({
    click: (params: { data: { x: string; hasChildren?: boolean } }) => {
      if (onItemClick && params.data?.x) {
        onItemClick(params.data.x)
      }
    },
  }), [onItemClick])

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height, width: '100%' }}
      onEvents={onEvents}
      notMerge
      lazyUpdate
    />
  )
}
