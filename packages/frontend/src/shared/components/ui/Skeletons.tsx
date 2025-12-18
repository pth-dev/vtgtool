import { Box, Card, CardContent, Grid, Skeleton } from '@mui/material'

export function CardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={40} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  )
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card>
      <CardContent>
        <Skeleton width="30%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardContent>
        <Skeleton width="30%" height={24} sx={{ mb: 2 }} />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={40} sx={{ mb: 1 }} />
        ))}
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <Box p={3}>
      {/* Header */}
      <Skeleton width={300} height={40} sx={{ mb: 1 }} />
      <Skeleton width={200} height={20} sx={{ mb: 3 }} />

      {/* Filter */}
      <Skeleton variant="rectangular" height={56} sx={{ mb: 3, borderRadius: 2 }} />

      {/* KPI Cards */}
      <Grid container spacing={2} mb={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 6, md: 3 }}>
            <CardSkeleton />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartSkeleton />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartSkeleton />
        </Grid>
      </Grid>

      {/* Trend */}
      <ChartSkeleton height={280} />
    </Box>
  )
}
