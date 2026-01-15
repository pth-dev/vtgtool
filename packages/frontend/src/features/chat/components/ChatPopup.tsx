/**
 * Chat Popup Component
 * Main chat popup container with messages and input
 */
import { useRef, useEffect } from 'react'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import { SmartToy } from '@mui/icons-material'

import { api } from '@/services/api'
import { useChatStore } from '../chatStore'
import { ChatHeader } from './ChatHeader'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'

export function ChatPopup(): JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    messages,
    isLoading,
    closeChat,
    addMessage,
    setLoading,
    setSessionId,
    clearMessages,
  } = useChatStore()
  
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
      const response = await api.sendChatMessage(content, true)
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
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 88,
        right: 16,
        width: 380,
        height: 520,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        zIndex: 1300,
        bgcolor: isDark ? '#0f172a' : '#fff',
      }}
    >
      <ChatHeader
        onClose={closeChat}
        onClear={handleClearHistory}
        hasMessages={messages.length > 0}
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
