import { Link } from '@tanstack/react-router'

import { Home, SearchOff } from '@mui/icons-material'
import { Box, Button, Typography, useTheme } from '@mui/material'

/**
 * NotFound Page Component
 * Displayed when user navigates to a route that doesn't exist
 */
export default function NotFound() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        textAlign: 'center',
        px: 3,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          bgcolor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 64, 175, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
        }}
      >
        <SearchOff sx={{ fontSize: 60, color: 'primary.main' }} />
      </Box>

      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '4rem', sm: '6rem' },
          fontWeight: 800,
          background: isDark
            ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
            : 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2,
        }}
      >
        404
      </Typography>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          mb: 1,
        }}
      >
        Page Not Found
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          maxWidth: 400,
          mb: 4,
        }}
      >
        The page you are looking for might have been removed, had its name changed, or is temporarily
        unavailable.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
          startIcon={<Home />}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
          }}
        >
          Go Home
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.history.back()}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
          }}
        >
          Go Back
        </Button>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          mt: 6,
          opacity: 0.7,
        }}
      >
        Error Code: 404 | VTGTOOL
      </Typography>
    </Box>
  )
}

