import { useState, ReactNode } from 'react'
import { Box, Card, CardContent, TextField, Typography, useTheme } from '@mui/material'
import { DragIndicator } from '@mui/icons-material'

interface Props {
  title: string
  subtitle?: string
  isEditMode?: boolean
  onTitleChange?: (title: string) => void
  children: ReactNode
  actions?: ReactNode
}

export function ChartCard({ title, subtitle, isEditMode, onTitleChange, children, actions }: Props) {
  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isEditMode ? `2px dashed ${theme.palette.primary.main}` : undefined,
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
          {isEditMode && <DragIndicator sx={{ cursor: 'grab', color: 'text.secondary' }} fontSize="small" />}
          {isEditMode && isEditing ? (
            <TextField
              size="small"
              value={title}
              onChange={(e) => onTitleChange?.(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              autoFocus
              sx={{ flex: 1 }}
              inputProps={{ style: { padding: '4px 8px', fontSize: 14 } }}
            />
          ) : (
            <Typography
              variant="subtitle2"
              fontWeight={600}
              sx={{ flex: 1, cursor: isEditMode ? 'text' : 'default' }}
              onClick={() => isEditMode && setIsEditing(true)}
            >
              {title}
            </Typography>
          )}
          {actions}
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
      </CardContent>
    </Card>
  )
}
