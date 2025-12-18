import { Link, useMatchRoute } from '@tanstack/react-router'

import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'

import { useThemeMode } from '@/shared/hooks'

// Brand colors for sidebar
const BRAND_COLORS = {
  activeBackground: '#FBAD18', // Yellow/Orange
  activeText: '#012E72', // Dark Blue
} as const

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
  onClick?: () => void
}

/**
 * Navigation item component for sidebar
 */
export function NavItem({ to, icon, label, collapsed, onClick }: NavItemProps) {
  const { isDark } = useThemeMode()
  const matchRoute = useMatchRoute()

  // Check if current route matches
  const isActive = !!matchRoute({ to, fuzzy: to !== '/' })

  return (
    <ListItemButton
      component={Link}
      to={to}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        px: 2,
        py: 1,
        minHeight: 44,
        color: 'text.secondary',
        ...(isActive && {
          bgcolor: BRAND_COLORS.activeBackground,
          color: BRAND_COLORS.activeText,
          '& .MuiListItemIcon-root': { color: BRAND_COLORS.activeText },
        }),
        '&:hover': {
          bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
        },
      }}
    >
      <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{icon}</ListItemIcon>
      {!collapsed && (
        <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, noWrap: true }} />
      )}
    </ListItemButton>
  )
}
