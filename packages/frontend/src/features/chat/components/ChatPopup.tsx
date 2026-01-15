/**
 * Chat Popup Component
 * Main chat popup container with messages and input
 */
import { useRef, useEffect, useState } from 'react'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import { SmartToy } from '@mui/icons-material'

import { api } from '@/services/api'
import { useChatStore } from '../chatStore'
import { ChatHeader } from './ChatHeader'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'

// Size configurations
const SIZES = {
  normal: { width: 380, height: 520 },
  expanded: { width: 600, height: 700 },
}

export function ChatPopup(): JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const {
    messages,
    isLoading,
    closeChat,
    addMessage,
    setLoading,
    setSessionId,
    clearMessages,
    selectedMonth,
  } = useChatStore()
  
  const currentSize = isExpanded ? SIZES.expanded : SIZES.normal
  
  function scrollToBottom(): void {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])
  
  async function handleSendMessage(content: string): Promise<void> {
    addMessage({ role: 'user', content })
    setLoading(true)
    
    try {
      // Send message with current selected month from dashboard
      const response = await api.sendChatMessage(content, true, undefined, selectedMonth || undefined)
      setSessionId(response.session_id)
      addMessage({ role: 'assistant', content: response.response })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      addMessage({
        role: 'assistant',
        content: `Sorry, I could not process your request. ${errorMessage}`,
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function handleClearHistory(): Promise<void> {
    try {
      await api.clearChatHistory()
    } catch {
      // Ignore API errors, still clear local
    }
    clearMessages()
  }
  
  return (
    <Paper
      data-tour-id="chat-popup"
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: isExpanded ? 20 : 88,
        right: 16,
        width: currentSize.width,
        height: currentSize.height,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        zIndex: 1300,
        bgcolor: isDark ? '#0f172a' : '#fff',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <ChatHeader
        onClose={closeChat}
        onClear={handleClearHistory}
        hasMessages={messages.length > 0}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />
      
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: isDark ? '#1e293b' : '#f8fafc',
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              textAlign: 'center',
              px: 3,
            }}
          >
            <SmartToy sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1" fontWeight={500} gutterBottom>
              Hello! I am VTG Assistant
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              I can help you analyze dashboard data, 
              explain metrics, and suggest improvements.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
      
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </Paper>
  )
}
