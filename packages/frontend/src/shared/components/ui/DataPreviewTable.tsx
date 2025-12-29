import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Chip, Tooltip, Typography } from '@mui/material'
import { TanStackTable } from './TanStackTable'
import type { ColumnSchema } from '@/types/api.types'

export type { ColumnSchema }

export interface DataPreviewTableProps {
  data: Record<string, unknown>[]
  columns?: ColumnSchema[]
  total?: number
  page?: number
  rowsPerPage?: number
  isLoading?: boolean
  showSearch?: boolean
  searchValue?: string
  showColumnTypes?: boolean
  showPagination?: boolean
  maxHeight?: number
  rowsPerPageOptions?: number[]
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  onSearchChange?: (search: string) => void
  emptyMessage?: string
  headerInfo?: string
}

export function DataPreviewTable({
  data,
  columns: columnSchemas,
  total,
  page = 0,
  rowsPerPage = 20,
  isLoading = false,
  showSearch = false,
  searchValue = '',
  showColumnTypes = false,
  showPagination = true,
  maxHeight = 500,
  rowsPerPageOptions = [10, 20, 50, 100],
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  emptyMessage = 'No data available',
  headerInfo,
}: DataPreviewTableProps) {
  // Get column names from schema, but also include any columns in data that aren't in schema
  const schemaColumnNames = columnSchemas?.map((c) => c.name) || []
  const dataColumnNames = data.length > 0 ? Object.keys(data[0]) : []
  // Use schema order first, then add any missing columns from data
  const columnNames = schemaColumnNames.length > 0 
    ? [...schemaColumnNames, ...dataColumnNames.filter(name => !schemaColumnNames.includes(name))]
    : dataColumnNames
  const totalCount = total ?? data.length

  const columns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(() => 
    columnNames.map((name) => {
      const schema = columnSchemas?.find((c) => c.name === name)
      return {
        id: name,
        // Use accessorFn instead of accessorKey to handle keys with dots (e.g., "Production Order No.")
        accessorFn: (row) => row[name],
        header: () => (
          <>
            <Tooltip title={name}><span>{name}</span></Tooltip>
            {showColumnTypes && schema?.detected_type && (
              <Chip label={schema.detected_type} size="small" sx={{ ml: 0.5, height: 18, fontSize: 10 }} />
            )}
          </>
        ),
        cell: ({ getValue }) => {
          const val = getValue()
          const str = val === null || val === undefined ? '' : String(val)
          return (
            <Tooltip title={str.length > 30 ? str : ''}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{str}</Typography>
            </Tooltip>
          )
        },
      }
    }), [columnNames, columnSchemas, showColumnTypes])

  const info = headerInfo || `${totalCount.toLocaleString()} rows • ${columnNames.length} columns`

  return (
    <TanStackTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      totalCount={onPageChange ? totalCount : undefined}
      page={page}
      pageSize={rowsPerPage}
      onPageChange={onPageChange}
      onPageSizeChange={onRowsPerPageChange}
      showPagination={showPagination}
      showSearch={showSearch}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      headerInfo={info}
      maxHeight={maxHeight}
      rowsPerPageOptions={rowsPerPageOptions}
      emptyMessage={emptyMessage}
      getRowId={(_, i) => String(i)}
    />
  )
}
