import { useEffect, useMemo, useRef, useState } from 'react'
import { Responsive } from 'react-grid-layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { Edit, Save, Close, DragIndicator, Settings } from '@mui/icons-material'

import { useAuthStore } from '@/features/auth'
import { BarChart, LineChart, RootCauseAnalysis, type TreemapItem } from '@/features/dashboard/charts'
import { api } from '@/services/api'

interface RootCause {
  root_cause: string
  count: number
  percent: number
  improvement_plan: string
}

interface ChartConfig {
  i: string
  title: string
  type: 'bar' | 'line' | 'rootcause'
  dataKey: string
  color: string
}

interface DashboardConfig {
  layouts: typeof defaultLayouts
  chartConfigs: ChartConfig[]
}

interface ChartData {
  by_customer?: Array<{ name: string; count?: number; value?: number; percent?: number }>
  by_category?: Array<{ name: string; count?: number; value?: number; percent?: number }>
  by_status?: Array<{ name: string; count?: number; value?: number; percent?: number }>
  trend?: Array<Record<string, unknown>>
}

interface EditableChartsGridProps {
  charts: ChartData
  rootCauses?: RootCause[]
  treemapData?: TreemapItem | null
  crossFilter?: { type: string; value: string } | null
  onCrossFilter: (type: string, value: string) => void
  onShowData: (dimension: string) => (value: string) => void
  isMobile?: boolean
}

const defaultLayouts = {
  lg: [
    { i: 'by_customer', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'by_category', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'trend', x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 3 },
    { i: 'root_cause', x: 0, y: 8, w: 12, h: 6, minW: 6, minH: 4 },
  ],
  md: [
    { i: 'by_customer', x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'by_category', x: 5, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'trend', x: 0, y: 4, w: 10, h: 4, minW: 5, minH: 3 },
    { i: 'root_cause', x: 0, y: 8, w: 10, h: 6, minW: 5, minH: 4 },
  ],
  sm: [
    { i: 'by_customer', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'by_category', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'trend', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'root_cause', x: 0, y: 12, w: 6, h: 6, minW: 3, minH: 4 },
  ],
}

const defaultChartConfigs: ChartConfig[] = [
  { i: 'by_customer', title: 'By Customer', type: 'bar', dataKey: 'by_customer', color: '#3b82f6' },
  { i: 'by_category', title: 'By Category', type: 'bar', dataKey: 'by_category', color: '#f59e0b' },
  { i: 'trend', title: 'Status Trend', type: 'line', dataKey: 'trend', color: '#8b5cf6' },
  { i: 'root_cause', title: 'Root Cause Analysis', type: 'rootcause', dataKey: 'root_cause', color: '#ef4444' },
]

const CONFIG_KEY = 'main-dashboard-config'

export function EditableChartsGrid({
  charts,
  rootCauses = [],
  treemapData = null,
  crossFilter,
  onCrossFilter,
  onShowData,
  isMobile = false,
}: EditableChartsGridProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const [isEditMode, setIsEditMode] = useState(false)
  const [layouts, setLayouts] = useState(defaultLayouts)
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>(defaultChartConfigs)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; chartId: string } | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  
  // Fix: Measure container width manually instead of using WidthProvider
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Load config from API
  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['dashboard-config', CONFIG_KEY],
    queryFn: () => api.getConfig<DashboardConfig>(CONFIG_KEY),
  })

  // Apply saved config, merge with defaults to include new charts
  useEffect(() => {
    if (savedConfig?.value) {
      // Merge layouts - add missing chart layouts from defaults
      if (savedConfig.value.layouts) {
        const mergedLayouts = { ...defaultLayouts }
        for (const breakpoint of Object.keys(defaultLayouts) as Array<keyof typeof defaultLayouts>) {
          const savedBp = savedConfig.value.layouts[breakpoint] || []
          const defaultBp = defaultLayouts[breakpoint]
          // Keep saved positions, add missing charts from defaults
          const savedIds = new Set(savedBp.map((l: { i: string }) => l.i))
          const missing = defaultBp.filter(l => !savedIds.has(l.i))
          mergedLayouts[breakpoint] = [...savedBp, ...missing]
        }
        setLayouts(mergedLayouts)
      }
      // Merge chartConfigs - add missing charts from defaults
      if (savedConfig.value.chartConfigs) {
        const savedIds = new Set(savedConfig.value.chartConfigs.map(c => c.i))
        const missing = defaultChartConfigs.filter(c => !savedIds.has(c.i))
        const migratedConfigs = savedConfig.value.chartConfigs.map(c => ({
          ...c,
          type: ((c.type as string) === 'pie' ? 'bar' : c.type) as 'bar' | 'line' | 'rootcause'
        }))
        setChartConfigs([...migratedConfigs, ...missing])
      }
    }
  }, [savedConfig])

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: (config: DashboardConfig) => api.updateConfig(CONFIG_KEY, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] })
      setIsEditMode(false)
    },
  })

  const handleLayoutChange = (_: unknown, allLayouts: typeof layouts) => {
    setLayouts(allLayouts)
  }

  const handleSave = () => {
    saveMutation.mutate({ layouts, chartConfigs })
  }

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

  const handleColorChange = (chartId: string, newColor: string) => {
    setChartConfigs((prev) => prev.map((c) => (c.i === chartId ? { ...c, color: newColor } : c)))
    setMenuAnchor(null)
  }

  const renderChart = (config: ChartConfig) => {
    // Special case for root cause analysis
    if (config.type === 'rootcause') {
      return (
        <RootCauseAnalysis
          rootCauses={rootCauses}
          treemapData={treemapData}
          isMobile={isMobile}
        />
      )
    }

    const data = charts[config.dataKey as keyof ChartData]
    if (!data || (Array.isArray(data) && data.length === 0)) return null

    if (config.type === 'bar') {
      return (
        <BarChart
          data={(data as Array<{ name: string; count?: number }>).slice(0, 10)}
          color={config.color}
          height={200}
          onClick={(name: string) => onCrossFilter(config.dataKey.replace('by_', ''), name)}
          onShowData={onShowData(config.dataKey.replace('by_', ''))}
          selected={
            crossFilter?.type === config.dataKey.replace('by_', '') ? crossFilter.value : undefined
          }
        />
      )
    }

    return (
      <LineChart
        data={data as Record<string, unknown>[]}
        xKey="date"
        series={[
          { key: 'LOCK', name: 'Lock', color: '#8b5cf6' },
          { key: 'HOLD', name: 'Hold', color: '#f59e0b' },
          { key: 'FAILURE', name: 'Failure', color: '#ef4444' },
        ]}
        height={200}
      />
    )
  }

  const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#ec4899', '#06b6d4']

  const gridChildren = useMemo(
    () =>
      chartConfigs.map((config) => (
        <Box key={config.i} sx={{ height: '100%' }}>
          {config.type === 'rootcause' ? (
            // RootCauseAnalysis has its own Card, just add edit controls
            <Box sx={{ height: '100%', position: 'relative' }}>
              {isEditMode && (
                <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                  <DragIndicator sx={{ cursor: 'grab', color: 'text.secondary' }} fontSize="small" />
                </Box>
              )}
              {renderChart(config)}
            </Box>
          ) : (
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: isEditMode ? `2px dashed ${theme.palette.primary.main}` : undefined,
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
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
                  {isEditMode && config.type === 'bar' && (
                    <IconButton
                      size="small"
                      onClick={(e) => setMenuAnchor({ el: e.currentTarget, chartId: config.i })}
                    >
                      <Settings fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ flex: 1, minHeight: 0 }}>{renderChart(config)}</Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )),
    [chartConfigs, charts, crossFilter, isEditMode, editingTitle, theme.palette.primary.main]
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
      {/* Edit Controls */}
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

      {/* Grid Layout */}
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

      {/* Color picker menu */}
      <Menu anchorEl={menuAnchor?.el} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}>
          Chart Color
        </Typography>
        {colors.map((color) => (
          <MenuItem
            key={color}
            onClick={() => menuAnchor && handleColorChange(menuAnchor.chartId, color)}
            sx={{ gap: 1 }}
          >
            <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: color }} />
            {color}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}
