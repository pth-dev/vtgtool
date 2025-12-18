import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import { Box } from '@mui/material'

import { GlobalConfirmDialog } from '@/shared/components/ui/GlobalConfirmDialog'
import NotFound from '@/shared/components/ui/NotFound'

interface RouterContext {
  auth: {
    isAuthenticated: boolean
    isAdmin: boolean
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Outlet />
      <GlobalConfirmDialog />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </Box>
  )
}

