import { Warning } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  confirmColor?: 'error' | 'primary' | 'warning'
  isLoading?: boolean
  icon?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Reusable confirmation dialog component
 */
export function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  isLoading = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon || (confirmColor === 'error' && <Warning color="error" />)}
        {title}
      </DialogTitle>
      <DialogContent>
        {typeof message === 'string' ? <Typography>{message}</Typography> : <Box>{message}</Box>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
