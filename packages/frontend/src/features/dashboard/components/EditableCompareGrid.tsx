import { useEffect, useMemo, useRef, useState } from 'react'
import { Responsive } from 'react-grid-layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { Edit, Save, Close, DragIndicator } from '@mui/icons-material'

import { useAuthStore } from '@/features/auth'
import { FailureRateTrend, HeatmapChart, MonthlyVolumeChart } from '@/features/dashboard/charts'
import { api } from '@/services/api'

interface MonthlyData {
  month: string
  label: string
  total: number
  lock: number
  hold: number
  failure: number
  failure_rate: number
}

interface TrendData {
  name: string
  data: { month: string; count: number }[]
}

interface CompareData {
  monthly_data: MonthlyData[]
  customer_trend: TrendData[]
  category_trend: TrendData[]
}

interface ChartConfig {
  i: string
  title: string
  subtitle?: string
}

interface CompareConfig {
  layouts: typeof defaultLayouts
  chartConfigs: ChartConfig[]
}

interface EditableCompareGridProps {
  data: CompareData
  isMobile?: boolean
}

const defaultLayouts = {
  lg: [
    { i: 'failure_rate', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'monthly_volume', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'customer_trend', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'category_trend', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
  ],
  md: [
    { i: 'failure_rate', x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'monthly_volume', x: 5, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'customer_trend', x: 0, y: 4, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'category_trend', x: 5, y: 4, w: 5, h: 4, minW: 3, minH: 3 },
  ],
  sm: [
    { i: 'failure_rate', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'monthly_volume', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'customer_trend', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'category_trend', x: 0, y: 12, w: 6, h: 4, minW: 3, minH: 3 },
  ],
}

const defaultChartConfigs: ChartConfig[] = [
  { i: 'failure_rate', title: 'Failure Rate Trend', subtitle: 'Cancelled / Total Orders × 100%' },
  { i: 'monthly_volume', title: 'Monthly Volume by Status', subtitle: 'Lock / Hold / Failure per month' },
  { i: 'customer_trend', title: 'Orders by Customer' },
  { i: 'category_trend', title: 'Orders by Category' },
]

const CONFIG_KEY = 'compare-dashboard-config'

export function EditableCompareGrid({ data, isMobile = false }: EditableCompareGridProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const [isEditMode, setIsEditMode] = useState(false)
  const [layouts, setLayouts] = useState(defaultLayouts)
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>(defaultChartConfigs)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['dashboard-config', CONFIG_KEY],
    queryFn: () => api.getConfig<CompareConfig>(CONFIG_KEY),
  })

  useEffect(() => {
    if (savedConfig?.value) {
      if (savedConfig.value.layouts) setLayouts(savedConfig.value.layouts)
      if (savedConfig.value.chartConfigs) setChartConfigs(savedConfig.value.chartConfigs)
    }
  }, [savedConfig])

  const saveMutation = useMutation({
    mutationFn: (config: CompareConfig) => api.updateConfig(CONFIG_KEY, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] })
      setIsEditMode(false)
    },
  })

  const handleLayoutChange = (_: unknown, allLayouts: typeof layouts) => setLayouts(allLayouts)
  const handleSave = () => saveMutation.mutate({ layouts, chartConfigs })
  const handleCancel = () => {
    if (savedConfig?.value) {
      setLayouts(savedConfig.value.layouts || defaultLayouts)
      setChartConfigs(savedConfig.value.chartConfigs || defaultChartConfigs)
    }
    setIsEditMode(false)
  }
  const handleTitleChange = (chartId: string, newTitle: string) => {
    setChartConfigs((prev) => prev.map((c) => (c.i === chartId ? { ...c, title: newTitle } : c)))
  }

  const renderChart = (config: ChartConfig) => {
    const height = isMobile ? 220 : 280
    switch (config.i) {
      case 'failure_rate':
        return (
          <FailureRateTrend
            data={data.monthly_data.map((d) => ({
              month: d.month,
              label: d.label,
              failure_rate: d.failure_rate,
              total: d.total,
              canceled: 0,
            }))}
            height={height}
          />
        )
      case 'monthly_volume':
        return <MonthlyVolumeChart data={data.monthly_data} height={height} />
      case 'customer_trend':
        return <HeatmapChart data={data.customer_trend || []} height={height} />
      case 'category_trend':
        return <HeatmapChart data={data.category_trend || []} height={height} />
      default:
        return null
    }
  }

  const gridChildren = useMemo(
    () =>
      chartConfigs.map((config) => (
        <Box key={config.i} sx={{ height: '100%' }}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: isEditMode ? `2px dashed ${theme.palette.primary.main}` : undefined,
            }}
          >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                {isEditMode && (
                  <DragIndicator sx={{ cursor: 'grab', color: 'text.secondary' }} fontSize="small" />
                )}
                {isEditMode && editingTitle === config.i ? (
                  <TextField
                    size="small"
                    value={config.title}
                    onChange={(e) => handleTitleChange(config.i, e.target.value)}
                    onBlur={() => setEditingTitle(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(null)}
                    autoFocus
                    sx={{ flex: 1 }}
                    inputProps={{ style: { padding: '4px 8px', fontSize: 14 } }}
                  />
                ) : (
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ flex: 1, cursor: isEditMode ? 'text' : 'default' }}
                    onClick={() => isEditMode && setEditingTitle(config.i)}
                  >
                    {config.title}
                  </Typography>
                )}
              </Box>
              {config.subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {config.subtitle}
                </Typography>
              )}
              <Box sx={{ flex: 1, minHeight: 0 }}>{renderChart(config)}</Box>
            </CardContent>
          </Card>
        </Box>
      )),
    [chartConfigs, data, isEditMode, editingTitle, theme.palette.primary.main, isMobile]
  )

  if (isLoading || !containerWidth) {
    return (
      <Box ref={containerRef} sx={{ display: 'flex', justifyContent: 'center', py: 4, minHeight: 200 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box ref={containerRef} sx={{ position: 'relative', mb: 3 }}>
      {isAdmin && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
          {isEditMode ? (
            <>
              <IconButton size="small" onClick={handleCancel} title="Cancel" disabled={saveMutation.isPending}>
                <Close />
              </IconButton>
              <IconButton
                size="small"
                color="primary"
                onClick={handleSave}
                title="Save Layout"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <CircularProgress size={20} /> : <Save />}
              </IconButton>
            </>
          ) : (
            <IconButton size="small" onClick={() => setIsEditMode(true)} title="Edit Layout">
              <Edit />
            </IconButton>
          )}
        </Box>
      )}

      <Responsive
        className="layout"
        layouts={layouts}
        width={containerWidth}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".MuiSvgIcon-root"
        style={{
          background: isEditMode ? (isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.02)') : undefined,
          borderRadius: 8,
          transition: 'background 0.2s',
        }}
      >
        {gridChildren}
      </Responsive>
    </Box>
  )
}
