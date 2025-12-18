import { create } from 'zustand'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'error' | 'primary' | 'warning'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmState {
  isOpen: boolean
  isLoading: boolean
  options: ConfirmOptions | null
  confirm: (options: ConfirmOptions) => void
  close: () => void
  setLoading: (loading: boolean) => void
}

/**
 * Global Confirm Dialog Store
 * Use this store to show confirmation dialogs from anywhere in the app
 *
 * Usage:
 * const { confirm } = useConfirmStore()
 * confirm({
 *   title: 'Delete User',
 *   message: 'Are you sure you want to delete this user?',
 *   confirmColor: 'error',
 *   onConfirm: () => deleteUser(id)
 * })
 */
export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  isLoading: false,
  options: null,

  confirm: (options) => {
    set({
      isOpen: true,
      isLoading: false,
      options: {
        title: 'Confirm',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmColor: 'primary',
        ...options,
      },
    })
  },

  close: () => {
    set({ isOpen: false, isLoading: false, options: null })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },
}))

/**
 * Hook for easy confirmation dialog usage
 * Returns a function that shows the confirm dialog and returns a promise
 */
export function useConfirm() {
  const { confirm } = useConfirmStore()
  return confirm
}
