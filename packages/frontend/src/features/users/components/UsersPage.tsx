import { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Add, Delete, Info } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { PageHeader } from '@/shared/components/ui'
import { TanStackTable } from '@/shared/components/ui/TanStackTable'
import { useConfirm } from '@/shared/stores'
import { createUserSchema, type CreateUserFormData } from '@/shared/validation'
import { useUsers } from '../hooks/useUsers'

interface User {
  id: number
  email: string
  full_name: string
}

export default function UsersPage() {
  const { users, createUser, deleteUser, isCreating, createError, resetCreateError } = useUsers()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', password: '', full_name: '' },
  })

  const columns = useMemo<ColumnDef<User, unknown>[]>(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'full_name', header: 'Name' },
    {
      id: 'actions',
      header: 'Actions',
      meta: { align: 'right' },
      enableSorting: false,
      cell: ({ row }) => (
        <IconButton color="error" onClick={() => handleDelete(row.original)}>
          <Delete />
        </IconButton>
      ),
    },
  ], [])

  const onSubmit = (data: CreateUserFormData) => {
    createUser(data, { onSuccess: () => { setOpen(false); reset() } })
  }

  const handleClose = () => { setOpen(false); reset(); resetCreateError() }

  const handleDelete = (user: User) => {
    confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.full_name || user.email}"?`,
      confirmText: 'Delete',
      confirmColor: 'error',
      onConfirm: () => deleteUser(user.id),
    })
  }

  // Get field-specific error from API response
  const getApiFieldError = (field: string): string | undefined => {
    return createError?.fieldErrors?.[field]
  }

  // Combine client and server validation errors
  const getFieldError = (field: 'email' | 'password' | 'full_name') => {
    return errors[field]?.message || getApiFieldError(field)
  }

  const hasFieldError = (field: 'email' | 'password' | 'full_name') => {
    return !!errors[field] || !!getApiFieldError(field)
  }

  // Only show general error if it's not a field-specific validation error
  const showGeneralError = createError && !createError.isValidationError

  return (
    <Box p={3}>
      <PageHeader
        title="User Management"
        action={<Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add User</Button>}
      />

      <Paper>
        <TanStackTable
          data={users as User[]}
          columns={columns}
          emptyMessage="No users found"
          getRowId={(u) => String(u.id)}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogContent>
            {showGeneralError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError.message}
              </Alert>
            )}

            <TextField
              {...register('email')}
              fullWidth
              label="Email"
              placeholder="user@example.com"
              margin="normal"
              error={hasFieldError('email')}
              helperText={getFieldError('email')}
              autoFocus
            />

            <TextField
              {...register('password')}
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              error={hasFieldError('password')}
              helperText={getFieldError('password') || 'At least 8 chars, uppercase, lowercase, number'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          Password requirements:<br/>
                          • At least 8 characters<br/>
                          • One uppercase letter (A-Z)<br/>
                          • One lowercase letter (a-z)<br/>
                          • One number (0-9)
                        </Typography>
                      }
                      arrow
                    >
                      <Info sx={{ color: 'action.active', cursor: 'help' }} fontSize="small" />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('full_name')}
              fullWidth
              label="Full Name"
              placeholder="John Doe"
              margin="normal"
              error={hasFieldError('full_name')}
              helperText={getFieldError('full_name')}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={isCreating}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
