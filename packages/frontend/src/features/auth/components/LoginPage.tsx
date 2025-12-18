import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { Alert, Box, Button, Card, CardContent, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'

import { useAuthStore } from '@/features/auth'
import { api, ApiError } from '@/services/api'
import { loginSchema, type LoginFormData } from '@/shared/validation'
const LOGO = '/logo.f0f4e5c943afc7875feb.png'

export default function LoginPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')
    try {
      await api.login(data.email, data.password)
      const user = await api.me()
      setAuth(user)
      navigate({ to: '/' })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message === 'Invalid credentials' ? 'Incorrect email or password' : err.message)
      } else {
        setError('Incorrect email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      display="flex"
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
      px={isMobile ? 2 : 0}
    >
      <Card 
        sx={{ 
          width: '100%', 
          maxWidth: isMobile ? '100%' : 400,
          boxShadow: isMobile ? 'none' : undefined,
          bgcolor: isMobile ? 'transparent' : undefined,
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 4 }}>
          <Box textAlign="center" mb={isMobile ? 3 : 4}>
            <Box
              component="img"
              src={LOGO}
              alt="VTGTOOL"
              sx={{ height: isMobile ? 40 : 48, mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Admin Login
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              margin="normal"
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              margin="normal"
              size={isMobile ? 'small' : 'medium'}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size={isMobile ? 'medium' : 'large'}
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box textAlign="center" mt={3}>
            <Typography
              component={Link}
              to="/"
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              Back to Dashboard
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
