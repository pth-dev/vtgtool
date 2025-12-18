import { useMemo } from 'react'
import { KpiGrid, type KpiConfig } from '@/shared/components/ui/KpiGrid'

interface AggregatedData {
  total_orders: number
  overall_failure_rate: number
  avg_monthly_rate: number
  trend_change: number
  trend_direction: 'improving' | 'worsening' | 'stable'
  best_month?: { label: string; failure_rate: number }
  worst_month?: { label: string; failure_rate: number }
}

interface Props {
  data: AggregatedData | null
  isMobile?: boolean
}

export function CompareKpiSection({ data, isMobile = false }: Props) {
  const items = useMemo<KpiConfig[]>(() => {
    if (!data) return []
    
    const trendIcon = data.trend_direction === 'improving' ? '↓' : data.trend_direction === 'worsening' ? '↑' : '→'
    const trendColor = data.trend_direction === 'improving' ? '#10b981' : data.trend_direction === 'worsening' ? '#ef4444' : '#6b7280'
    const trendLabel = data.trend_direction === 'improving' ? 'Improving' : data.trend_direction === 'worsening' ? 'Worsening' : 'Stable'
    const rateColor = (rate: number) => rate > 15 ? '#ef4444' : rate > 10 ? '#f59e0b' : '#10b981'

    const result: KpiConfig[] = [
      { key: 'total', title: 'Total Orders', value: data.total_orders.toLocaleString(), color: '#3b82f6' },
      { key: 'overall', title: 'Overall Failure Rate', value: data.overall_failure_rate, suffix: '%', color: rateColor(data.overall_failure_rate) },
      { key: 'avg', title: 'Avg Monthly Rate', value: data.avg_monthly_rate, suffix: '%', color: rateColor(data.avg_monthly_rate) },
      { key: 'trend', title: 'Trend', value: `${trendIcon} ${Math.abs(data.trend_change)}`, suffix: 'pt', subtitle: trendLabel, color: trendColor },
    ]

    if (data.best_month) {
      result.push({ key: 'best', title: 'Best Month', value: data.best_month.label, subtitle: `${data.best_month.failure_rate}%`, color: '#10b981' })
    }
    if (data.worst_month) {
      result.push({ key: 'worst', title: 'Worst Month', value: data.worst_month.label, subtitle: `${data.worst_month.failure_rate}%`, color: '#ef4444' })
    }

    return result
  }, [data])

  if (!data) return null
  return <KpiGrid items={items} isMobile={isMobile} />
}
