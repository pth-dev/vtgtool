import { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Add, Delete } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
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
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            <TextField {...register('email')} fullWidth label="Email" margin="normal" error={!!errors.email} helperText={errors.email?.message} autoFocus />
            <TextField {...register('password')} fullWidth label="Password" type="password" margin="normal" error={!!errors.password} helperText={errors.password?.message} />
            <TextField {...register('full_name')} fullWidth label="Full Name" margin="normal" error={!!errors.full_name} helperText={errors.full_name?.message} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={isCreating}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
