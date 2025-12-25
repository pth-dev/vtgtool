import { lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SuspenseLoader } from '@/shared/components/ui/SuspenseLoader'

// PERFORMANCE: Lazy load dashboard page to reduce initial bundle size
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage'))

function DashboardPageWithSuspense() {
  return (
    <SuspenseLoader message="Loading dashboard...">
      <DashboardPage />
    </SuspenseLoader>
  )
}

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPageWithSuspense,
})
