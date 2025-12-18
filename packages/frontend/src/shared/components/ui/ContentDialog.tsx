import { Close } from '@mui/icons-material'
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'

interface ContentDialogProps {
  open: boolean
  title: string
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  children: React.ReactNode
  actions?: React.ReactNode
  showCloseButton?: boolean
  onClose: () => void
}

/**
 * Reusable content dialog component
 * For displaying content, previews, forms, etc.
 */
export function ContentDialog({
  open,
  title,
  maxWidth = 'md',
  fullWidth = true,
  children,
  actions,
  showCloseButton = true,
  onClose,
}: ContentDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        {showCloseButton && (
          <IconButton onClick={onClose} size="small" sx={{ ml: 2 }}>
            <Close />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>
      {actions && <DialogActions sx={{ px: 3, pb: 2 }}>{actions}</DialogActions>}
    </Dialog>
  )
}
