import { ReactNode, useEffect, useState } from 'react'
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material'

import { LAYOUT } from '@/constants'

import { MainContent } from './MainContent'
import { MobileHeader } from './MobileHeader'
import { Sidebar } from './Sidebar'

interface Props {
  children?: ReactNode
}

export default function AppLayout({ children }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [collapsed, setCollapsed] = useState(isMobile)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setCollapsed(isMobile)
  }, [isMobile])

  const width = collapsed ? LAYOUT.DRAWER_COLLAPSED_WIDTH : LAYOUT.DRAWER_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile header */}
      {isMobile && <MobileHeader onMenuClick={() => setMobileOpen(true)} />}

      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: LAYOUT.DRAWER_WIDTH,
              bgcolor: 'background.paper',
            },
          }}
        >
          <Sidebar
            collapsed={false}
            onToggle={() => {}}
            isMobile
            onNavClick={() => setMobileOpen(false)}
          />
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& .MuiDrawer-paper': {
              width,
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden',
            },
          }}
        >
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            useAnimatedLogo
          />
        </Drawer>
      )}

      <MainContent isMobile={isMobile}>{children}</MainContent>
    </Box>
  )
}
