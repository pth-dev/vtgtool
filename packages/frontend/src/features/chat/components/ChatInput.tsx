/**
 * Chat Input Component
 * Text input with send button for chat messages
 */
import { useState, KeyboardEvent } from 'react'
import { Box, IconButton, TextField, useTheme } from '@mui/material'
import { Send } from '@mui/icons-material'

interface Props {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: Props): JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [message, setMessage] = useState('')
  
  function handleSend(): void {
    const trimmed = message.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setMessage('')
    }
  }
  
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  return (
    <Box
      data-tour-id="chat-input"
      sx={{
        display: 'flex',
        gap: 1,
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? '#0f172a' : '#fff',
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        multiline
        maxRows={3}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: isDark ? '#1e293b' : '#f1f5f9',
            borderRadius: 2,
          },
        }}
      />
      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': { bgcolor: 'primary.dark' },
          '&.Mui-disabled': { bgcolor: isDark ? '#374151' : '#e5e7eb' },
        }}
      >
        <Send fontSize="small" />
      </IconButton>
    </Box>
  )
}
