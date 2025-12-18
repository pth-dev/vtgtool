import { useMemo, useState } from 'react'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

interface Filters {
  month: string
  customers: string[]
  categories: string[]
  statuses: string[]
  products: string[]
}

interface MomChange {
  total_orders?: number | null
  lock_count?: number | null
  hold_count?: number | null
  failure_count?: number | null
  lock_rate?: number | null
  failure_rate?: number | null
}

interface DashboardData {
  kpis: {
    total_orders: number
    lock_count?: number
    hold_count?: number
    failure_count?: number
    lock_rate?: number
    failure_rate?: number
    resume_rate?: number
    top_category?: { name: string; percent: number }
    top_customer?: { name: string; percent: number }
  }
  prev_month_kpis?: Record<string, number>
  mom_change?: MomChange
  charts: {
    by_customer: { name: string; count: number; percent: number }[]
    by_category: { name: string; count: number; percent: number }[]
    by_status: { name: string; count: number; percent: number }[]
    trend: Record<string, unknown>[]
  }
  root_causes: { root_cause: string; count: number; percent: number; improvement_plan: string }[]
  filters: {
    months: string[]
    customers: string[]
    categories: string[]
    statuses: string[]
    products: string[]
  }
  selected_month: string
  prev_month?: string
  source_name?: string
}

export function useDashboard() {
  const [filters, setFilters] = useState<Filters>({
    month: '',
    customers: [],
    categories: [],
    statuses: [],
    products: [],
  })

  const [crossFilter, setCrossFilter] = useState<{ type: string; value: string } | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.month) params.set('month', filters.month)
    if (filters.customers.length) params.set('customers', filters.customers.join(','))
    if (filters.categories.length) params.set('categories', filters.categories.join(','))
    if (filters.statuses.length) params.set('statuses', filters.statuses.join(','))
    if (filters.products.length) params.set('products', filters.products.join(','))
    return params.toString()
  }, [filters])

  const { data, isLoading, isFetching } = useQuery<DashboardData>({
    queryKey: ['dashboard', queryString],
    queryFn: () => fetch(`/api/dashboard?${queryString}`).then((r) => r.json()),
    staleTime: 30000,
    placeholderData: keepPreviousData,
  })

  const updateFilter = (key: keyof Filters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleCrossFilter = (type: string, value: string) => {
    if (crossFilter?.type === type && crossFilter?.value === value) {
      setCrossFilter(null)
      if (type === 'customer') updateFilter('customers', [])
      if (type === 'category') updateFilter('categories', [])
    } else {
      setCrossFilter({ type, value })
      if (type === 'customer') updateFilter('customers', [value])
      if (type === 'category') updateFilter('categories', [value])
    }
  }

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, customers: [], categories: [], statuses: [], products: [] }))
    setCrossFilter(null)
  }

  return {
    data,
    isLoading,
    isFetching,
    filters,
    filterOptions: data?.filters,
    selectedMonth: data?.selected_month,
    momChange: data?.mom_change,
    crossFilter,
    updateFilter,
    toggleCrossFilter,
    clearFilters,
  }
}
