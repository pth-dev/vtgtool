/**
 * Chat Floating Button Component
 * Floating action button to open/close chat popup
 */
import { Fab, Badge, Zoom, useTheme } from '@mui/material'
import { SmartToy, Close } from '@mui/icons-material'

import { useChatStore } from '../chatStore'
import { ChatPopup } from './ChatPopup'

export function ChatFloatingButton(): JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { isOpen, messages, toggleChat } = useChatStore()
  
  const hasUnread = messages.length > 0 && !isOpen
  
  return (
    <>
      <Zoom in>
        <Fab
          color="primary"
          onClick={toggleChat}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300,
            width: 56,
            height: 56,
            boxShadow: isDark
              ? '0 4px 20px rgba(59, 130, 246, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              transform: 'scale(1.05)',
            },
            transition: 'transform 0.2s ease',
          }}
        >
          <Badge
            color="error"
            variant="dot"
            invisible={!hasUnread}
            sx={{
              '& .MuiBadge-badge': {
                top: 4,
                right: 4,
              },
            }}
          >
            {isOpen ? <Close /> : <SmartToy />}
          </Badge>
        </Fab>
      </Zoom>
      
      {isOpen && <ChatPopup />}
    </>
  )
}
