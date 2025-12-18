import { useCallback, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { IMPORT_WIZARD_STEPS, PAGINATION, SUCCESS_MESSAGES } from '@/constants'
import { api } from '@/services/api'
import { useNotification } from '@/shared/hooks'
import { getUserFriendlyMessage } from '@/shared/utils/error-parser'
import type { Dataset } from '@/types'

interface LocalFileData {
  file: File
  name: string
  rows: Record<string, unknown>[]
  columns: string[]
  row_count: number
  column_count: number
}

export function useDataManager() {
  const queryClient = useQueryClient()
  const { notification, showSuccess, showError, clearNotification } = useNotification()

  // Pagination state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')

  // Dialog states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  // Import wizard state - now uses local file data instead of uploaded source
  const [activeStep, setActiveStep] = useState(0)
  const [localFileData, setLocalFileData] = useState<LocalFileData | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const [dataType, setDataType] = useState<'dashboard' | 'isc'>('dashboard')
  const [isImporting, setIsImporting] = useState(false)

  // Fetch datasets
  const { data: datasetsResponse, isLoading } = useQuery({
    queryKey: ['datasets', page, rowsPerPage, search],
    queryFn: () => api.getDatasets(page + 1, rowsPerPage, search || undefined),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteDataset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      showSuccess(SUCCESS_MESSAGES.DELETED)
      setDeleteTarget(null)
    },
    onError: (err: unknown) => showError(getUserFriendlyMessage(err)),
  })

  // Actions
  const openImportDialog = useCallback(() => setImportDialogOpen(true), [])

  const closeImportDialog = useCallback(() => {
    setImportDialogOpen(false)
    setActiveStep(0)
    setLocalFileData(null)
    setDatasetName('')
    setDataType('dashboard')
  }, [])

  const handleFileSelected = useCallback((data: LocalFileData) => {
    setLocalFileData(data)
    setDatasetName(data.name.replace(/\.[^/.]+$/, ''))
    setActiveStep(1)
  }, [])

  const handleNextStep = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, IMPORT_WIZARD_STEPS.length - 1))
  }, [])

  const handleBackStep = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }, [])

  // Upload and create dataset - only called at final step
  const handleCreateDataset = useCallback(async () => {
    if (!localFileData || !datasetName.trim()) return
    
    setIsImporting(true)
    try {
      // Step 1: Upload file to server
      const uploadedSource = await api.uploadFile(localFileData.file, undefined, dataType)
      
      // Step 2: Process/create dataset
      await api.processDataset(uploadedSource.id, datasetName.trim())
      
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      showSuccess(SUCCESS_MESSAGES.IMPORTED)
      closeImportDialog()
    } catch (err: unknown) {
      showError(getUserFriendlyMessage(err))
    } finally {
      setIsImporting(false)
    }
  }, [localFileData, datasetName, dataType, queryClient, showSuccess, showError, closeImportDialog])

  const handleDeleteDataset = useCallback((id?: number) => {
    const targetId = id || deleteTarget?.id
    if (!targetId) return
    deleteMutation.mutate(targetId)
  }, [deleteTarget, deleteMutation])

  return {
    // Data
    datasets: datasetsResponse?.items || [],
    totalCount: datasetsResponse?.total || 0,
    // State
    page,
    rowsPerPage,
    search,
    isLoading,
    // Dialog states
    importDialogOpen,
    previewDataset,
    deleteTarget,
    // Import wizard state
    activeStep,
    localFileData,
    datasetName,
    dataType,
    // Notification
    notification,
    // Loading states
    isDeleting: deleteMutation.isPending,
    isImporting,
    // Actions
    setPage,
    setRowsPerPage: (rows: number) => { // @ts-ignore
      setRowsPerPage(rows)
      setPage(0)
    },
    setSearch: (s: string) => {
      setSearch(s)
      setPage(0)
    },
    openImportDialog,
    closeImportDialog,
    setPreviewDataset,
    setDeleteTarget,
    handleFileSelected,
    handleNextStep,
    handleBackStep,
    setDatasetName,
    setDataType,
    handleCreateDataset,
    handleDeleteDataset,
    clearNotification,
  }
}

export { IMPORT_WIZARD_STEPS as STEPS }
