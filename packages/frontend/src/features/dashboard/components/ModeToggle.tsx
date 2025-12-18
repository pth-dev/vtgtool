import { ToggleButton, ToggleButtonGroup } from '@mui/material'

export type DashboardMode = 'single' | 'compare'

interface ModeToggleProps {
  value: DashboardMode
  onChange: (mode: DashboardMode) => void
  compact?: boolean
}

export function ModeToggle({ value, onChange, compact }: ModeToggleProps) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      size="small"
      sx={compact ? { '& .MuiToggleButton-root': { px: 1, py: 0.5, fontSize: 11 } } : undefined}
    >
      <ToggleButton value="single">{compact ? 'Single' : 'Single Month'}</ToggleButton>
      <ToggleButton value="compare">Compare</ToggleButton>
    </ToggleButtonGroup>
  )
}
