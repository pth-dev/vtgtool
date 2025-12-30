import { useState } from 'react'
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material'
import { FileDownload } from '@mui/icons-material'

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
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: 'kpis' | 'customer' | 'category' | 'all') => {
    setIsExporting(true)
    setAnchorEl(null)
    
    try {
      // Dynamic import - only load XLSX when user actually exports
      const XLSX = await import('xlsx')
      
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
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={isExporting ? <CircularProgress size={16} /> : <FileDownload />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : 'Export'}
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
