import { useState, useMemo } from 'react'
import { Card, CardContent, Grid, Typography } from '@mui/material'
import { RootCauseBarChart } from './RootCauseBarChart'
import { RootCauseTable } from './RootCauseTable'
import { BreakdownTreemap, type TreemapItem } from './BreakdownTreemap'

export type { TreemapItem }

export interface RootCauseItem {
  root_cause: string
  count: number
  percent: number
  improvement_plan?: string
}

interface Props {
  rootCauses: RootCauseItem[]
  treemapData: TreemapItem | null
  isMobile?: boolean
}

export function RootCauseAnalysis({ rootCauses, treemapData, isMobile = false }: Props) {
  const [selectedBar, setSelectedBar] = useState<string | null>(null)
  const top10 = useMemo(() => rootCauses.slice(0, 10), [rootCauses])

  const filteredRootCauses = useMemo(() => {
    if (!selectedBar) return rootCauses.slice(0, 10)
    return rootCauses.filter((rc) => rc.root_cause === selectedBar).slice(0, 10)
  }, [rootCauses, selectedBar])

  const handleBarSelect = (name: string) => {
    setSelectedBar(selectedBar === name ? null : name)
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
          Root Cause Analysis
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Click bars to filter • Click treemap to drill down
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Top 10 Root Causes
            </Typography>
            <RootCauseBarChart data={top10} height={isMobile ? 280 : 350} onSelect={handleBarSelect} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <BreakdownTreemap data={treemapData} height={isMobile ? 250 : 320} />
          </Grid>

          <Grid size={12}>
            <RootCauseTable data={filteredRootCauses} selectedBar={selectedBar} isMobile={isMobile} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
