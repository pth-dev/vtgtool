import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Close } from '@mui/icons-material'
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { TanStackTable } from '@/shared/components/ui/TanStackTable'

interface DrilldownDialogProps {
  open: boolean
  dimension: string
  value: string
  data: Record<string, unknown>[]
  columns: string[]
  total: number
  page: number
  rowsPerPage: number
  isLoading: boolean
  onClose: () => void
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
}

export function DrilldownDialog({
  open, dimension, value, data, columns, total, page, rowsPerPage, isLoading,
  onClose, onPageChange, onRowsPerPageChange,
}: DrilldownDialogProps) {
  const isDark = useTheme().palette.mode === 'dark'
  const dimensionLabel = dimension === 'customer' ? 'Customer' : 'Category'

  const tableColumns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(() =>
    columns.map((name) => ({
      accessorKey: name,
      header: name,
      cell: ({ getValue }) => {
        const val = getValue()
        const str = val === null || val === undefined ? '' : String(val)
        return <Tooltip title={str.length > 30 ? str : ''}><Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{str}</Typography></Tooltip>
      },
    })), [columns])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: isDark ? '#0a0a0a' : 'background.paper', maxHeight: '85vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Orders for: {value}</Typography>
          <Typography variant="caption" color="text.secondary">{dimensionLabel} • {total} total orders</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TanStackTable
          data={data}
          columns={tableColumns}
          totalCount={total}
          page={page}
          pageSize={rowsPerPage}
          isLoading={isLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onRowsPerPageChange}
          maxHeight={500}
          emptyMessage="No orders found"
          getRowId={(_, i) => String(i)}
        />
      </DialogContent>
    </Dialog>
  )
}
