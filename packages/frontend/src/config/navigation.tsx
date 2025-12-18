import { ComponentType, lazy } from 'react'

import { Dashboard, People, Storage, TrackChanges } from '@mui/icons-material'

// Lazy load pages from features
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage'))
const DataManagerPage = lazy(() => import('@/features/data-manager/components/DataManagerPage'))
const UsersPage = lazy(() => import('@/features/users/components/UsersPage'))
const IscDoTrackingPage = lazy(
  () => import('@/features/isc-tracking/components/IscDoTrackingPage')
)

export interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  component: ComponentType
  adminOnly?: boolean
  hideInSidebar?: boolean
}

/**
 * SINGLE SOURCE OF TRUTH for navigation
 * Add new feature by adding entry here
 */
export const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: <Dashboard />,
    component: DashboardPage,
  },
  {
    path: '/isc-do-tracking',
    label: 'ISC - DO Tracking',
    icon: <TrackChanges />,
    component: IscDoTrackingPage,
  },
  {
    path: '/admin/data-sources',
    label: 'Data Sources',
    icon: <Storage />,
    component: DataManagerPage,
    adminOnly: true,
  },
  {
    path: '/admin/users',
    label: 'Users',
    icon: <People />,
    component: UsersPage,
    adminOnly: true,
  },
]

// Helper functions
export const getPublicItems = () => navItems.filter((item) => !item.adminOnly)
export const getAdminItems = () => navItems.filter((item) => item.adminOnly)
export const getSidebarItems = (isAdmin: boolean) =>
  navItems.filter((item) => !item.hideInSidebar && (!item.adminOnly || isAdmin))
