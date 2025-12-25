import { Suspense, ReactNode } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

interface SuspenseLoaderProps {
  children: ReactNode
  fallback?: ReactNode
  minHeight?: string | number
  message?: string
}

/**
 * Reusable Suspense wrapper with loading indicator
 * PERFORMANCE: Use this for lazy-loaded components
 */
export function SuspenseLoader({ 
  children, 
  fallback, 
  minHeight = '400px',
  message = 'Loading...'
}: SuspenseLoaderProps) {
  const defaultFallback = (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight={minHeight}
      gap={2}
    >
      <CircularProgress />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}

