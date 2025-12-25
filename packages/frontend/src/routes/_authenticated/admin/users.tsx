import { lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SuspenseLoader } from '@/shared/components/ui/SuspenseLoader'

// PERFORMANCE: Lazy load admin pages
const UsersPage = lazy(() => import('@/features/users/components/UsersPage'))

function UsersPageWithSuspense() {
  return (
    <SuspenseLoader message="Loading users...">
      <UsersPage />
    </SuspenseLoader>
  )
}

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: UsersPageWithSuspense,
})

