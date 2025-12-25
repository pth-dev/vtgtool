import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  full_name: string
  role: string
}

interface AuthState {
  user: User | null
  isHydrated: boolean
  setAuth: (user: User) => void
  logout: () => void
  setHydrated: (state: boolean) => void
}

/**
 * SECURITY FIX: Only store minimal, non-sensitive data in localStorage
 * - Only store user ID and role (needed for routing/UI)
 * - Do NOT store email, full_name, or any PII
 * - Full user data is fetched from API on app load
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,

      setAuth: (user) => {
        set({ user })
      },

      logout: () => {
        set({ user: null })
      },

      setHydrated: (state) => {
        set({ isHydrated: state })
      },
    }),
    {
      name: 'vtg-auth',
      storage: createJSONStorage(() => localStorage),
      // SECURITY: Only persist minimal data needed for auth state
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          role: state.user.role,
          // Do NOT persist email, full_name, or other PII
        } : null,
      }),
      onRehydrateStorage: () => (state) => {
        // Callback khi state được load từ localStorage
        state?.setHydrated(true)
      },
    }
  )
)

// Hook để kiểm tra đã hydrate chưa (tránh flash khi SSR/reload)
export const useIsHydrated = () => useAuthStore((state) => state.isHydrated)
