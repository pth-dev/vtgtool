import { Controller, useFormContext } from 'react-hook-form'

import { TextField, TextFieldProps } from '@mui/material'

import { useThemeMode } from '@/shared/hooks'

type FormTextFieldProps = {
  name: string
  rules?: object
} & Omit<TextFieldProps, 'name'>

/**
 * Form TextField integrated with React Hook Form
 * Must be used within FormProvider context
 */
export function FormTextField({ name, rules, ...props }: FormTextFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const { sx: themeSx } = useThemeMode()

  const error = errors[name]
  const errorMessage = error?.message as string | undefined

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <TextField
          {...field}
          {...props}
          error={!!error}
          helperText={errorMessage || props.helperText}
          sx={{
            '& .MuiOutlinedInput-root': themeSx.inputRoot,
            ...props.sx,
          }}
        />
      )}
    />
  )
}
