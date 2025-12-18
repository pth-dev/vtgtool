import { useEffect, useState } from 'react'

import { Box, Typography } from '@mui/material'

import { PaginatedData, api } from '@/services/api'
import { DataPreviewTable } from '@/shared/components/ui'

interface Props {
  datasetId?: number
  sourceId?: number
  title?: string
}

/**
 * DataPreview - Wrapper component that fetches and displays dataset/source preview
 * Uses DataPreviewTable for consistent table rendering
 */
export function DataPreview({ datasetId, sourceId, title }: Props) {
  const [data, setData] = useState<PaginatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (datasetId) {
          const result = await api.getDatasetData(
            datasetId,
            page + 1,
            rowsPerPage,
            undefined,
            undefined,
            search || undefined
          )
          setData(result)
        } else if (sourceId) {
          const result = await api.previewDataSource(sourceId, 100)
          setData({
            columns: result.columns,
            data: result.data,
            total: result.total_rows,
            page: 1,
            page_size: result.preview_rows,
            total_pages: 1,
          })
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
      setLoading(false)
    }
    fetchData()
  }, [datasetId, sourceId, page, rowsPerPage, search])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setPage(0)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setPage(0)
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}

      <DataPreviewTable
        data={data?.data || []}
        columns={data?.columns}
        total={data?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        isLoading={loading}
        showSearch={!!datasetId}
        searchValue={search}
        showColumnTypes
        showPagination={!!datasetId}
        maxHeight={500}
        rowsPerPageOptions={[25, 50, 100]}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={handleSearchChange}
        headerInfo={
          data ? `${data.total.toLocaleString()} rows • ${(data.columns?.length || Object.keys(data.data[0] || {}).length)} columns` : undefined
        }
      />
    </Box>
  )
}
