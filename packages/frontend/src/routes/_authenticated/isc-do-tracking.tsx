import { createFileRoute } from '@tanstack/react-router'

import IscDoTrackingPage from '@/features/isc-tracking/components/IscDoTrackingPage'

export const Route = createFileRoute('/_authenticated/isc-do-tracking')({
  component: IscDoTrackingPage,
})
