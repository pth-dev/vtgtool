import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import { Box, Button, Typography } from '@mui/material'
import { ErrorOutline, Refresh } from '@mui/icons-material'

import { GlobalConfirmDialog } from '@/shared/components/ui/GlobalConfirmDialog'
import NotFound from '@/shared/components/ui/NotFound'

interface RouterContext {
  auth: {
    isAuthenticated: boolean
    isAdmin: boolean
  }
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <ErrorOutline color="error" sx={{ fontSize: 64, mb: 2 }} />
      <Typography variant="h5" gutterBottom>Something went wrong</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
        {error.message || 'An unexpected error occurred'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" startIcon={<Refresh />} onClick={reset}>
          Try Again
        </Button>
        <Button variant="contained" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </Box>
    </Box>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ({ error, reset }) => <ErrorComponent error={error} reset={reset} />,
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

