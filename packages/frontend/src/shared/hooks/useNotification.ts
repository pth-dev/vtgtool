import { useCallback, useState } from 'react'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  message: string
  type: NotificationType
}

/**
 * Hook for managing notifications/snackbars
 */
export function useNotification() {
  const [notification, setNotification] = useState<Notification | null>(null)

  const showSuccess = useCallback((message: string) => {
    setNotification({ message, type: 'success' })
  }, [])

  const showError = useCallback((message: string) => {
    setNotification({ message, type: 'error' })
  }, [])

  const showInfo = useCallback((message: string) => {
    setNotification({ message, type: 'info' })
  }, [])

  const showWarning = useCallback((message: string) => {
    setNotification({ message, type: 'warning' })
  }, [])

  const clearNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return {
    notification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearNotification,
  }
}
