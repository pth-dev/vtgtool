import { Box, Typography } from '@mui/material'
import LineChart from './LineChart'

interface TrendData {
  month: string
  label: string
  failure_rate: number
  total: number
  canceled: number
}

interface FailureRateTrendProps {
  data: TrendData[]
  height?: number
}

export function FailureRateTrend({ data, height = 280 }: FailureRateTrendProps) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No trend data available</Typography>
      </Box>
    )
  }

  const chartData = data.map(d => ({
    label: d.label,
    failure_rate: d.failure_rate,
  }))

  return (
    <LineChart
      data={chartData}
      xKey="label"
      series={[{ key: 'failure_rate', name: 'Failure Rate %', color: '#ef4444' }]}
      height={height}
    />
  )
}
