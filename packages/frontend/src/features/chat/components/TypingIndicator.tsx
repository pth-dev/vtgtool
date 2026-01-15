/**
 * Typing Indicator Component
 * Shows animated dots when bot is typing (like Messenger)
 */
import { Box, useTheme } from '@mui/material'
import { SmartToy } from '@mui/icons-material'
import { keyframes } from '@mui/system'

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
`

export function TypingIndicator(): JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  
  return (
    <Box
      sx={{
        display: 'flex',
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
          bgcolor: isDark ? '#374151' : '#e5e7eb',
          color: isDark ? '#9ca3af' : '#6b7280',
          flexShrink: 0,
        }}
      >
        <SmartToy fontSize="small" />
      </Box>
      
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? '#1f2937' : '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          minWidth: 60,
          justifyContent: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: isDark ? '#6b7280' : '#9ca3af',
              animation: `${bounce} 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
