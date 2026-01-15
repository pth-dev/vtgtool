import { Grid } from '@mui/material'
import KpiCard from './KpiCard'

export interface KpiConfig {
  key: string
  title: string
  value: string | number
  suffix?: string
  subtitle?: string
  color: string
  change?: number | null
  changeType?: 'percent' | 'points'
  invertColor?: boolean
  tourId?: string
}

interface Props {
  items: KpiConfig[]
  isMobile?: boolean
  columns?: { xs: number; sm: number; md: number }
}

export function KpiGrid({ 
  items, 
  isMobile = false,
  columns = { xs: 6, sm: 4, md: 2 }
}: Props) {
  return (
    <Grid container spacing={isMobile ? 1.5 : 2} mb={3} data-tour-id="kpi-section">
      {items.map((item) => (
        <Grid key={item.key} size={{ xs: columns.xs, sm: columns.sm, md: columns.md }} data-tour-id={item.tourId}>
          <KpiCard
            title={item.title}
            value={item.value}
            suffix={item.suffix}
            subtitle={item.subtitle}
            color={item.color}
            change={item.change}
            changeType={item.changeType}
            invertColor={item.invertColor}
          />
        </Grid>
      ))}
    </Grid>
  )
}
