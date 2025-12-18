import { ReactNode, useCallback, useEffect, useRef } from 'react'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  onSubmit: () => void
  submitLabel?: string
  loading?: boolean
  error?: string | null
  children: ReactNode
}

/**
 * Reusable Form Dialog
 *
 * Keyboard shortcuts:
 * - Enter: Submit form (when not in textarea)
 * - Escape: Close dialog (handled by MUI Dialog)
 */
export default function FormDialog({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel = 'Save',
  loading,
  error,
  children,
}: Props) {
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  const handleSubmit = useCallback(() => {
    if (loading) return
    onSubmit()
  }, [loading, onSubmit])

  // Handle Enter key to submit (except in textarea)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !loading) {
        // Don't submit if user is in a textarea
        const target = event.target as HTMLElement
        if (target.tagName === 'TEXTAREA') return

        // Don't submit if user pressed Shift+Enter (common for newlines)
        if (event.shiftKey) return

        event.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit, loading]
  )

  // Auto-focus first input when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const dialog = document.querySelector('[role="dialog"]')
        const firstInput = dialog?.querySelector('input:not([type="hidden"])') as HTMLInputElement
        firstInput?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} onKeyDown={handleKeyDown} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button ref={submitButtonRef} variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
