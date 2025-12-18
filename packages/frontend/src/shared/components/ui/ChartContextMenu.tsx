import { TableChart, Visibility } from '@mui/icons-material'
import { Box, ListItemIcon, ListItemText, Menu, MenuItem, useTheme } from '@mui/material'

interface ChartContextMenuProps {
  /** Anchor position for the menu */
  anchorPosition: { top: number; left: number } | null
  /** Data item to display */
  data: {
    name: string
    count?: number
    value?: number
    percent?: number
  } | null
  /** Value unit (e.g., "orders", "items") */
  valueUnit?: string
  /** Callback when "Show Data" is clicked */
  onShowData?: () => void
  /** Callback when "Filter" is clicked */
  onFilter?: () => void
  /** Callback when menu is closed */
  onClose: () => void
}

/**
 * Reusable context menu for charts with Show Data and Filter actions
 */
export function ChartContextMenu({
  anchorPosition,
  data,
  valueUnit = 'orders',
  onShowData,
  onFilter,
  onClose,
}: ChartContextMenuProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  if (!data) return null

  const displayValue = data.count ?? data.value ?? 0

  return (
    <Menu
      open={anchorPosition !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition || undefined}
      onContextMenu={(e) => e.preventDefault()}
      slotProps={{
        paper: {
          sx: {
            bgcolor: isDark ? '#1f1f23' : 'background.paper',
            border: '1px solid',
            borderColor: isDark ? '#27272a' : 'divider',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : 3,
            minWidth: 200,
          },
          onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        },
        root: {
          onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ fontWeight: 600, fontSize: 14, color: 'text.primary' }}>{data.name}</Box>
        <Box sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
          {displayValue.toLocaleString()} {valueUnit}
          {data.percent !== undefined && ` (${data.percent}%)`}
        </Box>
      </Box>

      {/* Show Data option */}
      {onShowData && (
        <MenuItem onClick={onShowData} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Show Data"
            secondary="View detailed data"
            secondaryTypographyProps={{ fontSize: 11 }}
          />
        </MenuItem>
      )}

      {/* Filter option */}
      {onFilter && (
        <MenuItem onClick={onFilter} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Filter Dashboard"
            secondary="Filter by this value"
            secondaryTypographyProps={{ fontSize: 11 }}
          />
        </MenuItem>
      )}
    </Menu>
  )
}

