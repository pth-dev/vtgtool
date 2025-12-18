import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Delete, Storage, Visibility } from '@mui/icons-material'
import { Box, Chip, IconButton, Typography } from '@mui/material'
import { TanStackTable } from '@/shared/components/ui/TanStackTable'
import { EmptyState } from '@/shared/components/ui'
import type { Dataset } from '@/types'

interface Props {
  datasets: Dataset[]
  totalCount: number
  page: number
  rowsPerPage: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
  onPreview: (dataset: Dataset) => void
  onDelete: (dataset: Dataset) => void
  onImport?: () => void
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

export function DatasetTable({
  datasets, totalCount, page, rowsPerPage, isLoading,
  onPageChange, onRowsPerPageChange, onPreview, onDelete, onImport,
}: Props) {
  const columns = useMemo<ColumnDef<Dataset, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Dataset Name',
      cell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Storage color="primary" fontSize="small" />
          <Typography fontWeight={500}>{row.original.name}</Typography>
        </Box>
      ),
    },
    {
      accessorKey: 'row_count',
      header: 'Rows',
      meta: { align: 'right' },
      cell: ({ row }) => <Chip label={row.original.row_count?.toLocaleString() || '0'} size="small" variant="outlined" />,
    },
    {
      accessorKey: 'columns',
      header: 'Columns',
      meta: { align: 'right' },
      cell: ({ row }) => row.original.columns?.length || 0,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => <Typography variant="caption" color="text.secondary">{formatDate(row.original.created_at)}</Typography>,
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { align: 'center' },
      enableSorting: false,
      cell: ({ row }) => (
        <>
          <IconButton size="small" onClick={() => onPreview(row.original)} title="Preview"><Visibility /></IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(row.original)} title="Delete"><Delete /></IconButton>
        </>
      ),
    },
  ], [onPreview, onDelete])

  const emptyContent = onImport ? (
    <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
      <EmptyState
        icon={<Storage sx={{ fontSize: 48 }} />}
        title="No datasets yet"
        description="Import your first dataset to get started"
        action={{ label: 'Import Data', onClick: onImport, icon: <Storage /> }}
      />
    </Box>
  ) : undefined

  return (
    <TanStackTable
      data={datasets}
      columns={columns}
      isLoading={isLoading}
      totalCount={totalCount}
      page={page}
      pageSize={rowsPerPage}
      onPageChange={onPageChange}
      onPageSizeChange={onRowsPerPageChange}
      emptyContent={emptyContent}
      emptyMessage="No datasets found"
      getRowId={(d) => String(d.id)}
    />
  )
}
