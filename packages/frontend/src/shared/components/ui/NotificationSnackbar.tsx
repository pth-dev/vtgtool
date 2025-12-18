import { Alert, Snackbar } from '@mui/material'

interface NotificationSnackbarProps {
  open: boolean
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
  autoHideDuration?: number
}

/**
 * Notification snackbar component
 */
export function NotificationSnackbar({
  open,
  message,
  type,
  onClose,
  autoHideDuration = 4000,
}: NotificationSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert severity={type} onClose={onClose} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  )
}
