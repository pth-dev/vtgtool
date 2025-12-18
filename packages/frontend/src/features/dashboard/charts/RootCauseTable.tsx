import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Typography } from '@mui/material'
import { TanStackTable } from '@/shared/components/ui/TanStackTable'

interface RootCauseItem {
  root_cause: string
  count: number
  percent: number
  improvement_plan?: string
}

interface Props {
  data: RootCauseItem[]
  selectedBar: string | null
  isMobile?: boolean
}

export function RootCauseTable({ data, selectedBar, isMobile }: Props) {
  const columns = useMemo<ColumnDef<RootCauseItem, unknown>[]>(() => {
    const cols: ColumnDef<RootCauseItem, unknown>[] = [
      {
        accessorKey: 'root_cause',
        header: 'Root Cause',
        cell: ({ row }) => <span style={{ fontSize: 12 }}>{row.original.root_cause}</span>,
      },
      {
        accessorKey: 'count',
        header: 'Count',
        meta: { align: 'right' },
        cell: ({ row }) => row.original.count.toLocaleString(),
      },
      {
        accessorKey: 'percent',
        header: '%',
        meta: { align: 'right' },
        cell: ({ row }) => `${row.original.percent}%`,
      },
    ]
    if (!isMobile) {
      cols.push({
        accessorKey: 'improvement_plan',
        header: 'Improvement Plan',
        cell: ({ row }) => <span style={{ fontSize: 12 }}>{row.original.improvement_plan || '-'}</span>,
      })
    }
    return cols
  }, [isMobile])

  return (
    <>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {selectedBar ? `Details: ${selectedBar}` : 'Root Causes & Improvement Plans'}
      </Typography>
      <TanStackTable
        data={data}
        columns={columns}
        maxHeight={200}
        pageSize={10}
        rowsPerPageOptions={[10, 20]}
        emptyMessage="No root causes"
        getRowId={(row) => String(row.root_cause)}
      />
    </>
  )
}
