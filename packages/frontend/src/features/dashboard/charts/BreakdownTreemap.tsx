import { useState, useMemo } from 'react'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { EChartsTreemap } from './EChartsTreemap'

export interface TreemapItem {
  name: string
  value: number
  percent: number
  children?: TreemapItem[]
}

type DrillLevel = 'status' | 'customer' | 'category'

interface Props {
  data: TreemapItem | null
  height: number
}

const levelLabels: Record<DrillLevel, string> = {
  status: 'Status',
  customer: 'Customer',
  category: 'Category',
}

export function BreakdownTreemap({ data, height }: Props) {
  const [drillPath, setDrillPath] = useState<{ level: DrillLevel; value: string }[]>([])

  const currentData = useMemo(() => {
    if (!data) return []
    let current: TreemapItem[] = data.children || []

    for (const { value } of drillPath) {
      const found = current.find((c) => c.name === value)
      if (found?.children) current = found.children
      else break
    }

    return current.map((item) => ({
      x: item.name,
      y: item.value,
      percent: item.percent,
      hasChildren: !!item.children?.length,
    }))
  }, [data, drillPath])

  const handleItemClick = (name: string) => {
    const item = currentData.find((d) => d.x === name)
    if (item?.hasChildren) {
      const levels: DrillLevel[] = ['status', 'customer', 'category']
      const nextLevel = levels[drillPath.length]
      if (nextLevel) setDrillPath([...drillPath, { level: nextLevel, value: name }])
    }
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} mb={1} flexWrap="wrap">
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Breakdown:
        </Typography>
        <Chip
          label="All"
          size="small"
          variant={drillPath.length === 0 ? 'filled' : 'outlined'}
          onClick={() => setDrillPath([])}
          sx={{ cursor: 'pointer' }}
        />
        {drillPath.map((p, i) => (
          <Chip
            key={i}
            label={`${levelLabels[p.level]}: ${p.value}`}
            size="small"
            variant={i === drillPath.length - 1 ? 'filled' : 'outlined'}
            onClick={() => setDrillPath(drillPath.slice(0, i + 1))}
            onDelete={i === drillPath.length - 1 ? () => setDrillPath(drillPath.slice(0, i)) : undefined}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Stack>
      <Box sx={{ height }}>
        {currentData.length > 0 ? (
          <EChartsTreemap data={currentData} height={height} onItemClick={handleItemClick} />
        ) : (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">No data</Typography>
          </Box>
        )}
      </Box>
    </>
  )
}
