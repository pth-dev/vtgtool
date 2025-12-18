import { useState, ReactNode } from 'react'
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDownward, ArrowUpward, Search } from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'

interface Props<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  // Pagination
  pageSize?: number
  totalCount?: number
  page?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  rowsPerPageOptions?: number[]
  showPagination?: boolean
  // Search
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  // Header info
  headerInfo?: string
  // UI
  maxHeight?: number | string
  isLoading?: boolean
  emptyMessage?: string
  emptyContent?: ReactNode
  stickyHeader?: boolean
  size?: 'small' | 'medium'
  // Row
  selectedRow?: string | number | null
  onRowClick?: (row: T) => void
  getRowId?: (row: T, index: number) => string
}

export function TanStackTable<T>({
  data,
  columns,
  pageSize = 20,
  totalCount,
  page,
  onPageChange,
  onPageSizeChange,
  rowsPerPageOptions = [10, 20, 50, 100],
  showPagination = true,
  showSearch = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  headerInfo,
  maxHeight = 500,
  isLoading,
  emptyMessage = 'No data',
  emptyContent,
  stickyHeader = true,
  size = 'small',
  selectedRow,
  onRowClick,
  getRowId,
}: Props<T>) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const headerBg = isDark ? '#1a1a1a' : 'grey.50'

  const [sorting, setSorting] = useState<SortingState>([])
  const isServerSide = totalCount !== undefined && onPageChange !== undefined
  const [clientPage, setClientPage] = useState(0)
  const [clientPageSize, setClientPageSize] = useState(pageSize)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex: isServerSide ? (page ?? 0) : clientPage, pageSize: isServerSide ? pageSize : clientPageSize },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    manualPagination: isServerSide,
    pageCount: isServerSide ? Math.ceil((totalCount ?? 0) / pageSize) : undefined,
    getRowId: getRowId,
  })

  const currentPage = isServerSide ? (page ?? 0) : clientPage
  const currentPageSize = isServerSide ? pageSize : clientPageSize
  const count = isServerSide ? (totalCount ?? 0) : data.length

  const handlePageChange = (_: unknown, newPage: number) => {
    if (isServerSide && onPageChange) onPageChange(newPage)
    else setClientPage(newPage)
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value)
    if (isServerSide && onPageSizeChange) onPageSizeChange(newSize)
    else { setClientPageSize(newSize); setClientPage(0) }
  }

  if (isLoading) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (data.length === 0 && !showSearch) {
    return emptyContent || (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header with search and info */}
      {(showSearch || headerInfo) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 2 }}>
          {headerInfo && (
            <Typography variant="body2" color="text.secondary">{headerInfo}</Typography>
          )}
          {showSearch && onSearchChange && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }}
              sx={{ minWidth: 200 }}
            />
          )}
        </Box>
      )}

      {data.length === 0 ? (
        emptyContent || <Box sx={{ py: 4, textAlign: 'center' }}><Typography color="text.secondary">{emptyMessage}</Typography></Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ maxHeight }}>
            <Table size={size} stickyHeader={stickyHeader}>
              <TableHead>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableCell
                        key={header.id}
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                        sx={{
                          cursor: header.column.getCanSort() ? 'pointer' : 'default',
                          userSelect: 'none',
                          fontWeight: 600,
                          bgcolor: headerBg,
                          whiteSpace: 'nowrap',
                        }}
                        align={(header.column.columnDef.meta as { align?: 'left' | 'right' | 'center' })?.align}
                      >
                        <Box display="flex" alignItems="center" gap={0.5} justifyContent={(header.column.columnDef.meta as { align?: string })?.align === 'right' ? 'flex-end' : (header.column.columnDef.meta as { align?: string })?.align === 'center' ? 'center' : 'flex-start'}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && <ArrowUpward sx={{ fontSize: 16 }} />}
                          {header.column.getIsSorted() === 'desc' && <ArrowDownward sx={{ fontSize: 16 }} />}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    selected={selectedRow !== undefined && row.id === String(selectedRow)}
                    onClick={() => onRowClick?.(row.original)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        align={(cell.column.columnDef.meta as { align?: 'left' | 'right' | 'center' })?.align}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {showPagination && (
            <TablePagination
              component="div"
              count={count}
              page={currentPage}
              rowsPerPage={currentPageSize}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handlePageSizeChange}
              rowsPerPageOptions={rowsPerPageOptions}
            />
          )}
        </>
      )}
    </Box>
  )
}
