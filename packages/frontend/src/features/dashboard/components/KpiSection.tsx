import { useMemo } from 'react'
import { KpiGrid, type KpiConfig } from '@/shared/components/ui/KpiGrid'

interface KpiData {
  total_orders: number
  lock_count?: number
  hold_count?: number
  failure_count?: number
  resume_success_rate?: number
  failure_rate?: number
}

interface MomChange {
  resume_success_rate?: number | null
  failure_rate?: number | null
}

interface Props {
  kpis: KpiData
  momChange?: MomChange
  isMobile?: boolean
}

export function KpiSection({ kpis, momChange, isMobile = false }: Props) {
  const items = useMemo<KpiConfig[]>(() => [
    { key: 'total', title: 'Total Orders', value: kpis.total_orders, color: '#3b82f6', tourId: 'kpi-total' },
    { key: 'lock', title: 'Lock', value: kpis.lock_count || 0, color: '#8b5cf6', tourId: 'kpi-lock' },
    { key: 'hold', title: 'Hold', value: kpis.hold_count || 0, color: '#f59e0b', tourId: 'kpi-hold' },
    { key: 'failure', title: 'Failure', value: kpis.failure_count || 0, color: '#ef4444', tourId: 'kpi-failed' },
    { 
      key: 'resume', 
      title: 'Resume Success', 
      value: kpis.resume_success_rate || 0, 
      suffix: '%',
      color: '#10b981',
      change: momChange?.resume_success_rate,
      changeType: 'points',
      tourId: 'kpi-resume',
    },
    { 
      key: 'rate', 
      title: 'Failure Rate', 
      value: kpis.failure_rate || 0, 
      suffix: '%',
      color: '#ef4444',
      change: momChange?.failure_rate,
      changeType: 'points',
      invertColor: true,
      tourId: 'kpi-rate',
    },
  ], [kpis, momChange])

  return <KpiGrid items={items} isMobile={isMobile} />
}
