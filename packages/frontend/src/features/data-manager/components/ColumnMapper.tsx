import { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Alert, Box, Chip, MenuItem, Select, Switch, Typography } from '@mui/material'
import { TanStackTable } from '@/shared/components/ui/TanStackTable'
import { ColumnSchema, ValidationResult } from '@/services/api'

interface Props {
  columns: ColumnSchema[]
  validation?: ValidationResult
  onMappingChange?: (mapping: ColumnMapping[]) => void
}

export interface ColumnMapping {
  name: string
  targetType: 'string' | 'number' | 'date' | 'boolean'
  include: boolean
}

const TYPE_OPTIONS = ['string', 'number', 'date', 'boolean'] as const

export function ColumnMapper({ columns, validation, onMappingChange }: Props) {
  const [mapping, setMapping] = useState<ColumnMapping[]>(
    columns.map((col) => ({ name: col.name, targetType: col.detected_type, include: true }))
  )

  const handleTypeChange = (index: number, type: ColumnMapping['targetType']) => {
    const newMapping = [...mapping]
    newMapping[index].targetType = type
    setMapping(newMapping)
    onMappingChange?.(newMapping)
  }

  const handleIncludeChange = (index: number, include: boolean) => {
    const newMapping = [...mapping]
    newMapping[index].include = include
    setMapping(newMapping)
    onMappingChange?.(newMapping)
  }

  const tableColumns = useMemo<ColumnDef<ColumnSchema, unknown>[]>(() => [
    {
      id: 'include',
      header: 'Include',
      enableSorting: false,
      cell: ({ row }) => (
        <Switch
          checked={mapping[row.index]?.include ?? true}
          onChange={(e) => handleIncludeChange(row.index, e.target.checked)}
          size="small"
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Column Name',
      cell: ({ row }) => <Typography variant="body2" fontWeight="medium">{row.original.name}</Typography>,
    },
    {
      accessorKey: 'detected_type',
      header: 'Detected Type',
      cell: ({ row }) => <Chip label={row.original.detected_type} size="small" variant="outlined" />,
    },
    {
      id: 'targetType',
      header: 'Target Type',
      enableSorting: false,
      cell: ({ row }) => (
        <Select
          value={mapping[row.index]?.targetType ?? row.original.detected_type}
          onChange={(e) => handleTypeChange(row.index, e.target.value as ColumnMapping['targetType'])}
          size="small"
          sx={{ minWidth: 100 }}
        >
          {TYPE_OPTIONS.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
        </Select>
      ),
    },
    {
      id: 'stats',
      header: 'Stats',
      enableSorting: false,
      cell: ({ row }) => (
        <Typography variant="caption" color="text.secondary">
          {row.original.unique_count} unique • {row.original.null_count} nulls
        </Typography>
      ),
    },
    {
      id: 'sample',
      header: 'Sample Values',
      enableSorting: false,
      cell: ({ row }) => (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
          {row.original.sample_values?.slice(0, 3).join(', ')}
        </Typography>
      ),
    },
  ], [mapping])

  const dataWithOpacity = columns.map((col, i) => ({ ...col, _opacity: mapping[i]?.include ? 1 : 0.5 }))

  return (
    <Box>
      {validation && (
        <Box sx={{ mb: 2 }}>
          {validation.errors.map((err, i) => <Alert key={i} severity="error" sx={{ mb: 1 }}>{err}</Alert>)}
          {validation.warnings.map((warn, i) => <Alert key={i} severity="warning" sx={{ mb: 1 }}>{warn}</Alert>)}
          {validation.duplicate_rows > 0 && <Alert severity="info" sx={{ mb: 1 }}>{validation.duplicate_rows} duplicate rows will be removed</Alert>}
        </Box>
      )}

      <TanStackTable
        data={dataWithOpacity}
        columns={tableColumns}
        showPagination={false}
        getRowId={(row) => row.name}
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {mapping.filter((m) => m.include).length} of {columns.length} columns selected
        </Typography>
      </Box>
    </Box>
  )
}
