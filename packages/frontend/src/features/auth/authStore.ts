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
      partialize: (state) => ({
        user: state.user,
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
