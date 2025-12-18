import { useEffect, useRef, useState, ReactNode } from 'react'
import { Responsive, Layout } from 'react-grid-layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, CircularProgress, IconButton, useTheme } from '@mui/material'
import { Edit, Save, Close } from '@mui/icons-material'
import { useAuthStore } from '@/features/auth'
import { api } from '@/services/api'

export interface GridConfig<T> {
  layouts: Record<string, Layout[]>
  chartConfigs: T[]
}

interface Props<T> {
  configKey: string
  defaultLayouts: Record<string, Layout[]>
  defaultConfigs: T[]
  children: (props: {
    configs: T[]
    isEditMode: boolean
    onConfigChange: (configs: T[]) => void
  }) => ReactNode
}

export function EditableGridWrapper<T extends { i: string }>({
  configKey,
  defaultLayouts,
  defaultConfigs,
  children,
}: Props<T>) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')

  const [isEditMode, setIsEditMode] = useState(false)
  const [layouts, setLayouts] = useState(defaultLayouts)
  const [configs, setConfigs] = useState<T[]>(defaultConfigs)

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
    queryKey: ['dashboard-config', configKey],
    queryFn: () => api.getConfig<GridConfig<T>>(configKey),
  })

  useEffect(() => {
    if (savedConfig?.value) {
      if (savedConfig.value.layouts) {
        const mergedLayouts = { ...defaultLayouts }
        for (const bp of Object.keys(defaultLayouts)) {
          const saved = savedConfig.value.layouts[bp] || []
          const defaults = defaultLayouts[bp]
          const savedIds = new Set(saved.map((l) => l.i))
          mergedLayouts[bp] = [...saved, ...defaults.filter((l) => !savedIds.has(l.i))]
        }
        setLayouts(mergedLayouts)
      }
      if (savedConfig.value.chartConfigs) {
        const savedIds = new Set(savedConfig.value.chartConfigs.map((c) => c.i))
        const missing = defaultConfigs.filter((c) => !savedIds.has(c.i))
        setConfigs([...savedConfig.value.chartConfigs, ...missing])
      }
    }
  }, [savedConfig, defaultLayouts, defaultConfigs])

  const saveMutation = useMutation({
    mutationFn: (config: GridConfig<T>) => api.updateConfig(configKey, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] })
      setIsEditMode(false)
    },
  })

  const handleSave = () => saveMutation.mutate({ layouts, chartConfigs: configs })
  
  const handleCancel = () => {
    if (savedConfig?.value) {
      setLayouts(savedConfig.value.layouts || defaultLayouts)
      setConfigs(savedConfig.value.chartConfigs || defaultConfigs)
    }
    setIsEditMode(false)
  }

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
              <IconButton size="small" onClick={handleCancel} disabled={saveMutation.isPending}>
                <Close />
              </IconButton>
              <IconButton size="small" color="primary" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <CircularProgress size={20} /> : <Save />}
              </IconButton>
            </>
          ) : (
            <IconButton size="small" onClick={() => setIsEditMode(true)}>
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
        onLayoutChange={(_, all) => setLayouts(all)}
        draggableHandle=".MuiSvgIcon-root"
        style={{
          background: isEditMode ? (isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.02)') : undefined,
          borderRadius: 8,
        }}
      >
        {children({ configs, isEditMode, onConfigChange: setConfigs })}
      </Responsive>
    </Box>
  )
}
