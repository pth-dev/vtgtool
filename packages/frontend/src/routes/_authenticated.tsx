import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import AppLayout from '@/features/layout/components/AppLayout'

// Public paths that don't require authentication
const publicPaths = ['/', '/isc-do-tracking']

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    // Allow public paths without auth
    if (publicPaths.includes(location.pathname)) {
      return
    }
    // Require auth for admin routes
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
