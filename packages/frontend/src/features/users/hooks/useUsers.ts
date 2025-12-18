import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/services/api'
import { getUserFriendlyMessage } from '@/shared/utils/error-parser'

export function useUsers() {
  const queryClient = useQueryClient()

  const query = useQuery({ queryKey: ['users'], queryFn: api.getUsers })

  const createMutation = useMutation({
    mutationFn: (data: { email: string; password: string; full_name: string }) =>
      api.createUser({ ...data, role: 'admin' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    createUser: createMutation.mutate,
    deleteUser: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error ? getUserFriendlyMessage(createMutation.error) : null,
    resetCreateError: createMutation.reset,
  }
}
