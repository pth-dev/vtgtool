import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material'

interface FilterMultiSelectProps {
  label: string
  value: string[]
  options: string[]
  onChange: (value: string[]) => void
  isMobile?: boolean
  isDark?: boolean
}

export function FilterMultiSelect({
  label,
  value,
  options,
  onChange,
  isMobile = false,
  isDark = false,
}: FilterMultiSelectProps) {
  const isActive = value.length > 0

  return (
    <FormControl
      size="small"
      fullWidth={isMobile}
      sx={{
        minWidth: isMobile ? undefined : 120,
        '& .MuiOutlinedInput-root': {
          bgcolor: isActive
            ? isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff'
            : isDark ? '#18181b' : 'white',
          borderRadius: 1.5,
          '& fieldset': {
            borderColor: isActive ? '#3b82f6' : isDark ? '#27272a' : '#e2e8f0',
            borderWidth: isActive ? 2 : 1,
          },
        },
      }}
    >
      <InputLabel sx={{ fontSize: 14 }}>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={(e) =>
          onChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)
        }
        input={<OutlinedInput label={label} />}
        renderValue={(selected) =>
          selected.length === 1 ? selected[0] : `${selected.length} selected`
        }
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 300,
              bgcolor: isDark ? '#18181b' : 'white',
              border: '1px solid',
              borderColor: isDark ? '#27272a' : '#e2e8f0',
            },
          },
        }}
        sx={{ fontSize: 14 }}
      >
        {options?.map((opt) => (
          <MenuItem key={opt} value={opt} dense>
            <Checkbox checked={value.includes(opt)} size="small" />
            <ListItemText primary={opt} primaryTypographyProps={{ fontSize: 13 }} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
