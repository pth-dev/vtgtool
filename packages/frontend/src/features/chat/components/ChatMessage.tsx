/**
 * Chat Message Component
 * Displays a single chat message with role-based styling
 */
import { Box, Typography, useTheme } from '@mui/material'
import { SmartToy, Person } from '@mui/icons-material'

import type { ChatMessage as ChatMessageType } from '@/types'

interface Props {
  message: ChatMessageType
}

export function ChatMessage({ message }: Props): JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isUser = message.role === 'user'
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1,
        mb: 2,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isUser 
            ? 'primary.main' 
            : isDark ? '#374151' : '#e5e7eb',
          color: isUser ? 'white' : isDark ? '#9ca3af' : '#6b7280',
          flexShrink: 0,
        }}
      >
        {isUser ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
      </Box>
      
      <Box
        sx={{
          maxWidth: '80%',
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: isUser
            ? 'primary.main'
            : isDark ? '#1f2937' : '#f3f4f6',
          color: isUser ? 'white' : 'text.primary',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.5,
          }}
        >
          {message.content}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            opacity: 0.7,
            fontSize: 10,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </Box>
    </Box>
  )
}
