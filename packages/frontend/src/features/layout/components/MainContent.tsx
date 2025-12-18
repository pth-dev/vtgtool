import { ReactNode } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Box, useTheme } from '@mui/material'

interface MainContentProps {
  children?: ReactNode
  isMobile?: boolean
}

export function MainContent({ children, isMobile = false }: MainContentProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        bgcolor: isDark ? 'background.default' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        pt: isMobile ? 7 : 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {children || <Outlet />}
    </Box>
  )
}
