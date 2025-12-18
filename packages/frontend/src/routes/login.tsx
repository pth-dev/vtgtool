import { createFileRoute, redirect } from '@tanstack/react-router'

import LoginPage from '@/features/auth/components/LoginPage'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    // Redirect to dashboard if already authenticated
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

