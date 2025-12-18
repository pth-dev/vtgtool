import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/services/api'

export function useDataSources() {
  const queryClient = useQueryClient()

  const query = useQuery({ 
    queryKey: ['datasources'], 
    queryFn: () => api.getDataSources()
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadFile(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasources'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteDataSource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasources'] }),
  })

  return {
    sources: query.data?.items ?? [],
    isLoading: query.isLoading,
    uploadFile: (file: File) => uploadMutation.mutate(file),
    deleteSource: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    previewData: api.previewDataSource,
  }
}
