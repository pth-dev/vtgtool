import { useCallback, useState } from 'react'

import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { Alert, Box, LinearProgress, Typography, useTheme } from '@mui/material'
import * as XLSX from 'xlsx'

import { ERROR_MESSAGES, FILE_UPLOAD } from '@/constants'

interface LocalFileData {
  file: File
  name: string
  rows: Record<string, unknown>[]
  columns: string[]
  row_count: number
  column_count: number
}

interface Props {
  onFileSelected: (data: LocalFileData) => void
  onError?: (error: string) => void
  dataType?: 'dashboard' | 'isc'
}

export function UploadDropzone({ onFileSelected, onError }: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!FILE_UPLOAD.ACCEPTED_TYPES.includes(ext as any)) {
      return `${ERROR_MESSAGES.UNSUPPORTED_FILE_TYPE}. Accepted: ${FILE_UPLOAD.ACCEPTED_TYPES.join(', ')}`
    }
    if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
      return `${ERROR_MESSAGES.FILE_TOO_LARGE}. Maximum size: ${FILE_UPLOAD.MAX_SIZE_DISPLAY}`
    }
    return null
  }

  const parseFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        onError?.(validationError)
        return
      }

      setError(null)
      setProgress(10)

      try {
        const ext = file.name.split('.').pop()?.toLowerCase()
        let rows: Record<string, unknown>[] = []
        let columns: string[] = []

        if (ext === 'csv') {
          const text = await file.text()
          setProgress(50)
          const lines = text.split('\n').filter(l => l.trim())
          if (lines.length > 0) {
            columns = lines[0].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
            rows = lines.slice(1, 101).map(line => {
              const values = line.split(',')
              const row: Record<string, unknown> = {}
              columns.forEach((col, i) => {
                row[col] = values[i]?.trim().replace(/^"|"$/g, '') || ''
              })
              return row
            })
          }
        } else if (ext === 'xlsx' || ext === 'xls') {
          const buffer = await file.arrayBuffer()
          setProgress(50)
          const workbook = XLSX.read(buffer, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
          if (jsonData.length > 0) {
            columns = (jsonData[0] as string[]).map(c => String(c || '').trim())
            rows = jsonData.slice(1, 101).map(row => {
              const obj: Record<string, unknown> = {}
              columns.forEach((col, i) => {
                obj[col] = (row as unknown[])[i] ?? ''
              })
              return obj
            })
          }
        } else if (ext === 'json') {
          const text = await file.text()
          setProgress(50)
          const jsonData = JSON.parse(text)
          rows = Array.isArray(jsonData) ? jsonData.slice(0, 100) : [jsonData]
          if (rows.length > 0) {
            columns = Object.keys(rows[0])
          }
        }

        setProgress(100)
        setTimeout(() => setProgress(null), 300)

        onFileSelected({
          file,
          name: file.name,
          rows,
          columns,
          row_count: rows.length,
          column_count: columns.length,
        })
      } catch (err: any) {
        setProgress(null)
        const msg = 'Failed to parse file. Please check the format.'
        setError(msg)
        onError?.(msg)
      }
    },
    [onFileSelected, onError]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) parseFile(file)
    },
    [parseFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) parseFile(file)
      e.target.value = ''
    },
    [parseFile]
  )

  return (
    <Box>
      <Box
        component="label"
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
          minHeight: 280,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : isDark ? '#3f3f46' : 'grey.400',
          borderRadius: 2,
          bgcolor: isDragging
            ? isDark ? 'rgba(59, 130, 246, 0.1)' : 'primary.50'
            : isDark ? '#18181b' : 'grey.50',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'primary.50',
          },
        }}
      >
        <input
          type="file"
          hidden
          accept={FILE_UPLOAD.ACCEPTED_TYPES.join(',')}
          onChange={handleFileSelect}
        />
        <CloudUploadIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Drag & drop file here
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to browse • CSV, Excel, JSON • Max {FILE_UPLOAD.MAX_SIZE_DISPLAY}
        </Typography>
      </Box>

      {progress !== null && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Reading file... {progress}%
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  )
}
