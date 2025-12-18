import { SvgIconComponent } from '@mui/icons-material'
import { Box, Button, Typography } from '@mui/material'

interface EmptyStateProps {
  icon?: React.ReactElement<SvgIconComponent>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

/**
 * Empty state component for lists/tables
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        textAlign: 'center',
      }}
    >
      {icon && <Box sx={{ color: 'grey.400', mb: 1, '& svg': { fontSize: 48 } }}>{icon}</Box>}
      <Typography color="text.secondary" gutterBottom fontWeight={500}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 2, maxWidth: 300 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" startIcon={action.icon} onClick={action.onClick} sx={{ mt: 1 }}>
          {action.label}
        </Button>
      )}
    </Box>
  )
}
