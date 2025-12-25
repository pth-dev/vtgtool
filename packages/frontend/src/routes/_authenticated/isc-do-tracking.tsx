import { lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SuspenseLoader } from '@/shared/components/ui/SuspenseLoader'

// PERFORMANCE: Lazy load ISC tracking page
const IscDoTrackingPage = lazy(() => import('@/features/isc-tracking/components/IscDoTrackingPage'))

function IscDoTrackingPageWithSuspense() {
  return (
    <SuspenseLoader message="Loading ISC DO Tracking...">
      <IscDoTrackingPage />
    </SuspenseLoader>
  )
}

export const Route = createFileRoute('/_authenticated/isc-do-tracking')({
  component: IscDoTrackingPageWithSuspense,
})
