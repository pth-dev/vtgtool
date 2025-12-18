import { Box, Card, CardContent, Typography } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

interface Props {
  title: string
  value: number | string
  color?: string
  suffix?: string
  subtitle?: string
  change?: number | null  // MoM change percentage or points
  changeType?: 'percent' | 'points'  // percent for counts, points for rates
  invertColor?: boolean  // true = decrease is good (for failure rate)
}

export default function KpiCard({ 
  title, 
  value, 
  color = '#3b82f6', 
  suffix, 
  subtitle,
  change,
  changeType = 'percent',
  invertColor = false,
}: Props) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value
  
  const isPositive = change !== null && change !== undefined && change > 0
  const isNegative = change !== null && change !== undefined && change < 0
  
  // Determine color: green = good, red = bad
  let changeColor = 'text.secondary'
  if (change !== null && change !== undefined && change !== 0) {
    const isGood = invertColor ? isNegative : isPositive
    changeColor = isGood ? '#10b981' : '#ef4444'
  }

  return (
    <Card sx={{ borderLeft: 4, borderColor: color, height: '100%' }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" color="text.secondary" noWrap>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h5" fontWeight={600}>
            {displayValue}{suffix}
          </Typography>
          {change !== null && change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              {isPositive && <TrendingUp sx={{ fontSize: 14, color: changeColor }} />}
              {isNegative && <TrendingDown sx={{ fontSize: 14, color: changeColor }} />}
              <Typography variant="caption" sx={{ color: changeColor, fontWeight: 500 }}>
                {isPositive ? '+' : ''}{change}{changeType === 'points' ? 'pt' : '%'}
              </Typography>
            </Box>
          )}
        </Box>
        {subtitle && !change && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
