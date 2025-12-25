import { lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SuspenseLoader } from '@/shared/components/ui/SuspenseLoader'

// PERFORMANCE: Lazy load data manager page
const DataManagerPage = lazy(() => import('@/features/data-manager/components/DataManagerPage'))

function DataManagerPageWithSuspense() {
  return (
    <SuspenseLoader message="Loading data sources...">
      <DataManagerPage />
    </SuspenseLoader>
  )
}

export const Route = createFileRoute('/_authenticated/admin/data-sources')({
  component: DataManagerPageWithSuspense,
})

