import { useState } from 'react'
import { Button, Menu, MenuItem } from '@mui/material'
import { FileDownload } from '@mui/icons-material'
import * as XLSX from 'xlsx'

interface ExportData {
  kpis: Record<string, unknown>
  charts: {
    by_customer?: Array<{ name: string; count: number; percent: number }>
    by_category?: Array<{ name: string; count: number; percent: number }>
  }
  selectedMonth?: string
}

interface ExportButtonProps {
  data: ExportData
}

export function ExportButton({ data }: ExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleExport = (type: 'kpis' | 'customer' | 'category' | 'all') => {
    const wb = XLSX.utils.book_new()
    const month = data.selectedMonth || 'data'

    if (type === 'kpis' || type === 'all') {
      const kpiData = Object.entries(data.kpis).map(([key, value]) => ({
        Metric: key.replace(/_/g, ' ').toUpperCase(),
        Value: typeof value === 'object' ? JSON.stringify(value) : value,
      }))
      const ws = XLSX.utils.json_to_sheet(kpiData)
      XLSX.utils.book_append_sheet(wb, ws, 'KPIs')
    }

    if ((type === 'customer' || type === 'all') && data.charts.by_customer) {
      const ws = XLSX.utils.json_to_sheet(data.charts.by_customer.map(d => ({
        Customer: d.name,
        Count: d.count,
        'Percent (%)': d.percent,
      })))
      XLSX.utils.book_append_sheet(wb, ws, 'By Customer')
    }

    if ((type === 'category' || type === 'all') && data.charts.by_category) {
      const ws = XLSX.utils.json_to_sheet(data.charts.by_category.map(d => ({
        Category: d.name,
        Count: d.count,
        'Percent (%)': d.percent,
      })))
      XLSX.utils.book_append_sheet(wb, ws, 'By Category')
    }

    XLSX.writeFile(wb, `dashboard_${month}.xlsx`)
    setAnchorEl(null)
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<FileDownload />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Export
      </Button>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleExport('all')}>Export All</MenuItem>
        <MenuItem onClick={() => handleExport('kpis')}>KPIs Only</MenuItem>
        <MenuItem onClick={() => handleExport('customer')}>By Customer</MenuItem>
        <MenuItem onClick={() => handleExport('category')}>By Category</MenuItem>
      </Menu>
    </>
  )
}
