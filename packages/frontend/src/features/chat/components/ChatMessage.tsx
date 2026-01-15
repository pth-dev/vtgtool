/**
 * Chat Message Component
 * Displays a single chat message with role-based styling
 */
import { Box, Typography, Button, useTheme } from '@mui/material'
import { SmartToy, Person, PlayArrow } from '@mui/icons-material'

import type { ChatMessage as ChatMessageType } from '@/types'
import { useTour, getTourById } from '@/features/tour'
import { useChatStore } from '../chatStore'

interface Props {
  message: ChatMessageType
}

// Parse tour marker from message content
function parseTourMarker(content: string): { cleanContent: string; tourId: string | null } {
  const tourMatch = content.match(/\[TOUR:([a-z-]+)\]$/i)
  if (tourMatch) {
    return {
      cleanContent: content.replace(/\n?\[TOUR:[a-z-]+\]$/i, '').trim(),
      tourId: tourMatch[1],
    }
  }
  return { cleanContent: content, tourId: null }
}

export function ChatMessage({ message }: Props): JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isUser = message.role === 'user'
  const { startTour, isActive } = useTour()
  const closeChat = useChatStore((s) => s.closeChat)
  
  // Parse tour marker from assistant messages
  const { cleanContent, tourId } = isUser 
    ? { cleanContent: message.content, tourId: null }
    : parseTourMarker(message.content)
  
  const tour = tourId ? getTourById(tourId) : null
  
  const handleStartTour = () => {
    if (tourId && !isActive) {
      closeChat() // Close chat so user can see the tour
      setTimeout(() => startTour(tourId), 300) // Small delay for animation
    }
  }
  
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
          {cleanContent}
        </Typography>
        
        {/* Tour suggestion button */}
        {tour && (
          <Button
            size="small"
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleStartTour}
            disabled={isActive}
            sx={{
              mt: 1.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              },
            }}
          >
            Start Tour: {tour.name}
          </Button>
        )}
        
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
