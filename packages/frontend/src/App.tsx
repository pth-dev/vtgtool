import { useMemo } from 'react'

import { RouterProvider } from '@tanstack/react-router'

import { router } from './app/router'
import { useAuthStore } from './features/auth'

export default function App() {
  const user = useAuthStore((s) => s.user)

  const auth = useMemo(
    () => ({
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }),
    [user]
  )

  return <RouterProvider router={router} context={{ auth }} />
}
