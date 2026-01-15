/**
 * Chat Header Component
 * Header with title, close, clear, and expand buttons
 */
import { Box, IconButton, Typography, Tooltip, useTheme } from '@mui/material'
import { Close, DeleteOutline, SmartToy, OpenInFull, CloseFullscreen } from '@mui/icons-material'

interface Props {
  onClose: () => void
  onClear: () => void
  hasMessages: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}

export function ChatHeader({ onClose, onClear, hasMessages, isExpanded, onToggleExpand }: Props): JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? '#0f172a' : 'primary.main',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy sx={{ color: isDark ? 'primary.main' : 'white', fontSize: 24 }} />
        <Typography
          fontWeight={600}
          sx={{ color: isDark ? 'white' : 'white' }}
        >
          VTG Assistant
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {hasMessages && (
          <Tooltip title="Clear history">
            <IconButton
              size="small"
              onClick={onClear}
              sx={{ color: isDark ? '#9ca3af' : 'rgba(255,255,255,0.8)' }}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={isExpanded ? "Shrink" : "Expand"}>
          <IconButton
            data-tour-id="chat-expand-button"
            size="small"
            onClick={onToggleExpand}
            sx={{ color: isDark ? '#9ca3af' : 'rgba(255,255,255,0.8)' }}
          >
            {isExpanded ? <CloseFullscreen fontSize="small" /> : <OpenInFull fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Close">
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: isDark ? '#9ca3af' : 'rgba(255,255,255,0.8)' }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
