import { Link, useNavigate } from '@tanstack/react-router'
import { Login, Logout } from '@mui/icons-material'
import { Box, Button, Divider, List } from '@mui/material'

import { getSidebarItems } from '@/config/navigation'
import { useAuthStore } from '@/features/auth'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'

import { AnimatedLogo } from './AnimatedLogo'
import { NavItem } from './NavItem'

const LOGO_FULL = '/logo.f0f4e5c943afc7875feb.png'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  useAnimatedLogo?: boolean
  onNavClick?: () => void
}

export function Sidebar({ collapsed, onToggle, isMobile = false, useAnimatedLogo = false, onNavClick }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const sidebarItems = getSidebarItems(isAdmin)
  const showText = !collapsed

  const handleLogout = () => {
    logout()
    navigate({ to: '/' })
  }

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: !isMobile ? 'pointer' : 'default',
          minHeight: 64,
          transition: 'all 0.2s ease',
          '&:hover': !isMobile ? { bgcolor: 'action.hover' } : {},
        }}
        onClick={() => !isMobile && onToggle()}
      >
        {useAnimatedLogo ? (
          <AnimatedLogo expanded={showText} />
        ) : (
          <Box
            component="img"
            src={LOGO_FULL}
            alt="VTGTOOL"
            sx={{ height: 36, width: 'auto', maxWidth: 180, objectFit: 'contain' }}
          />
        )}
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {sidebarItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            onClick={onNavClick}
          />
        ))}
      </List>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <ThemeToggle />
        </Box>
        {user ? (
          <Button
            startIcon={<Logout />}
            onClick={handleLogout}
            size="small"
            color="inherit"
            sx={{ minWidth: 0, justifyContent: showText ? 'flex-start' : 'center', width: '100%' }}
          >
            {showText && 'Logout'}
          </Button>
        ) : (
          <Button
            component={Link}
            to="/login"
            startIcon={<Login />}
            size="small"
            color="inherit"
            sx={{ minWidth: 0, justifyContent: showText ? 'flex-start' : 'center', width: '100%' }}
          >
            {showText && 'Admin Login'}
          </Button>
        )}
      </Box>
    </>
  )
}
