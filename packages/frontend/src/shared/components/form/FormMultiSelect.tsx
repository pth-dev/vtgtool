import { Controller, useFormContext } from 'react-hook-form'

import {
  Checkbox,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps,
} from '@mui/material'

import { useThemeMode } from '@/shared/hooks'

interface Option {
  value: string
  label: string
}

type FormMultiSelectProps = {
  name: string
  label: string
  options: Option[]
  rules?: object
} & Omit<SelectProps<string[]>, 'name' | 'label' | 'multiple'>

/**
 * Form MultiSelect integrated with React Hook Form
 * Must be used within FormProvider context
 */
export function FormMultiSelect({
  name,
  label,
  options,
  rules,
  size = 'small',
  ...props
}: FormMultiSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const { sx: themeSx, isDark, colors } = useThemeMode()

  const error = errors[name]
  const errorMessage = error?.message as string | undefined

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => {
        const isActive = (field.value as string[])?.length > 0
        return (
          <FormControl fullWidth size={size} error={!!error}>
            <InputLabel>{label}</InputLabel>
            <Select
              {...field}
              {...props}
              multiple
              input={<OutlinedInput label={label} />}
              renderValue={(selected) =>
                selected.length === 1 ? selected[0] : `${selected.length} selected`
              }
              sx={{
                ...themeSx.inputRoot,
                bgcolor: isActive ? (isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff') : colors.input,
                '& fieldset': {
                  borderColor: isActive ? '#3b82f6' : colors.border,
                  borderWidth: isActive ? 2 : 1,
                },
                ...props.sx,
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    bgcolor: isDark ? '#18181b' : 'white',
                    border: '1px solid',
                    borderColor: colors.border,
                  },
                },
              }}
            >
              {options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} dense>
                  <Checkbox checked={(field.value as string[])?.includes(opt.value)} size="small" />
                  <ListItemText primary={opt.label} primaryTypographyProps={{ fontSize: 13 }} />
                </MenuItem>
              ))}
            </Select>
            {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
          </FormControl>
        )
      }}
    />
  )
}
