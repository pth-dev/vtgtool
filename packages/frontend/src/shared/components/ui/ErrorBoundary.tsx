import { Component, ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { ErrorOutline } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <ErrorOutline color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>Something went wrong</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button variant="outlined" onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </Box>
      )
    }
    return this.props.children
  }
}
