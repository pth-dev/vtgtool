import { Controller, useFormContext } from 'react-hook-form'

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material'

import { useThemeMode } from '@/shared/hooks'

interface Option {
  value: string | number
  label: string
}

type FormSelectProps = {
  name: string
  label: string
  options: Option[]
  rules?: object
} & Omit<SelectProps, 'name' | 'label'>

/**
 * Form Select integrated with React Hook Form
 * Must be used within FormProvider context
 */
export function FormSelect({
  name,
  label,
  options,
  rules,
  size = 'small',
  ...props
}: FormSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const { sx: themeSx, isDark } = useThemeMode()

  const error = errors[name]
  const errorMessage = error?.message as string | undefined

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <FormControl fullWidth size={size} error={!!error}>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            {...props}
            label={label}
            sx={{
              ...themeSx.inputRoot,
              ...props.sx,
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDark ? '#18181b' : 'white',
                  border: '1px solid',
                  borderColor: 'divider',
                },
              },
            }}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
