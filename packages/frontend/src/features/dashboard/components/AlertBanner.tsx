import { Alert, AlertTitle, Collapse } from '@mui/material'

interface AlertBannerProps {
  failureRate: number
  threshold?: number
}

export function AlertBanner({ failureRate, threshold = 20 }: AlertBannerProps) {
  const isWarning = failureRate >= threshold

  return (
    <Collapse in={isWarning}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>High Failure Rate Alert</AlertTitle>
        Failure Rate ({failureRate}%) exceeds threshold ({threshold}%). Review root causes and take action.
      </Alert>
    </Collapse>
  )
}
