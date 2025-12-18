import { useCallback, useEffect, useRef } from 'react'

import { Delete, Info, Warning } from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

import { useConfirmStore } from '@/shared/stores'

const ICONS = {
  error: <Delete color="error" />,
  warning: <Warning color="warning" />,
  primary: <Info color="primary" />,
}

/**
 * Global Confirmation Dialog
 * Render this component once in App.tsx or main layout
 * Use useConfirmStore().confirm() to trigger from anywhere
 *
 * Keyboard shortcuts:
 * - Enter: Confirm action
 * - Escape: Cancel (handled by MUI Dialog)
 */
export function GlobalConfirmDialog() {
  const { isOpen, isLoading, options, close, setLoading } = useConfirmStore()
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  const handleConfirm = useCallback(async () => {
    if (!options || isLoading) return
    try {
      setLoading(true)
      await options.onConfirm()
      close()
    } catch (error) {
      setLoading(false)
    }
  }, [options, isLoading, setLoading, close])

  const handleCancel = useCallback(() => {
    if (isLoading) return
    options?.onCancel?.()
    close()
  }, [options, isLoading, close])

  // Handle Enter key to confirm
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !isLoading) {
        event.preventDefault()
        handleConfirm()
      }
    },
    [handleConfirm, isLoading]
  )

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!options) return null

  const icon = ICONS[options.confirmColor || 'primary']

  return (
    <Dialog open={isOpen} onClose={handleCancel} onKeyDown={handleKeyDown} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        {options.title}
      </DialogTitle>
      <DialogContent>
        <Typography>{options.message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} disabled={isLoading}>
          {options.cancelText}
        </Button>
        <Button
          ref={confirmButtonRef}
          variant="contained"
          color={options.confirmColor}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : options.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
