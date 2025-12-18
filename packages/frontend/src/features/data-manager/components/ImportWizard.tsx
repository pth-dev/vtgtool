import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CheckCircle } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { TanStackTable } from '@/shared/components/ui/TanStackTable'
import { UploadDropzone } from '@/features/data-manager/components'
import { IMPORT_WIZARD_STEPS } from '@/constants'

interface LocalFileData {
  file: File
  name: string
  rows: Record<string, unknown>[]
  columns: string[]
  row_count: number
  column_count: number
}

interface ImportWizardProps {
  open: boolean
  activeStep: number
  localFileData: LocalFileData | null
  datasetName: string
  isImporting: boolean
  dataType: 'dashboard' | 'isc'
  onClose: () => void
  onFileSelected: (data: LocalFileData) => void
  onFileError: (error: string) => void
  onNext: () => void
  onBack: () => void
  onDatasetNameChange: (name: string) => void
  onDataTypeChange: (type: 'dashboard' | 'isc') => void
  onImport: () => void
}

export function ImportWizard({
  open, activeStep, localFileData, datasetName, isImporting, dataType,
  onClose, onFileSelected, onFileError, onNext, onBack, onDatasetNameChange, onDataTypeChange, onImport,
}: ImportWizardProps) {
  const columns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(() => 
    (localFileData?.columns || []).map((col) => ({
      accessorKey: col,
      header: col,
      cell: ({ getValue }) => {
        const val = String(getValue() ?? '')
        return <Tooltip title={val.length > 30 ? val : ''}><span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{val}</span></Tooltip>
      },
    })), [localFileData?.columns])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import Data</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ my: 3 }}>
          {IMPORT_WIZARD_STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {activeStep === 0 && (
            <Box>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Data Type</InputLabel>
                <Select value={dataType} label="Data Type" onChange={(e) => onDataTypeChange(e.target.value as 'dashboard' | 'isc')}>
                  <MenuItem value="dashboard">Dashboard (Lock/Hold/Failed)</MenuItem>
                  <MenuItem value="isc">ISC DO System</MenuItem>
                </Select>
              </FormControl>
              <UploadDropzone onFileSelected={onFileSelected} onError={onFileError} dataType={dataType} />
            </Box>
          )}

          {activeStep === 1 && localFileData && (
            <Box>
              <Alert severity="info" icon={<CheckCircle />} sx={{ mb: 2 }}>
                Preview: <strong>{localFileData.name}</strong> ({localFileData.row_count} rows, {localFileData.column_count} columns)
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>File will be uploaded when you click "Import Dataset"</Typography>
              </Alert>
              <TanStackTable
                data={localFileData.rows.slice(0, 10)}
                columns={columns}
                maxHeight={350}
                showPagination={false}
                getRowId={(_, i) => String(i)}
              />
              {localFileData.row_count > 10 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Showing first 10 of {localFileData.row_count} rows
                </Typography>
              )}
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
              <Typography variant="h6" gutterBottom>Name Your Dataset</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>Give your dataset a name to use in charts and dashboards</Typography>
              <TextField fullWidth value={datasetName} onChange={(e) => onDatasetNameChange(e.target.value)} placeholder="e.g. Sales Q4 2024" sx={{ my: 2 }} autoFocus />
              {localFileData && (
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Import Summary</Typography>
                  <Typography variant="body2" color="text.secondary">File: {localFileData.name}</Typography>
                  <Typography variant="body2" color="text.secondary">Rows: {localFileData.row_count.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Columns: {localFileData.column_count}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && <Button onClick={onBack}>Back</Button>}
        {activeStep < IMPORT_WIZARD_STEPS.length - 1 ? (
          <Button variant="contained" onClick={onNext} disabled={activeStep === 0 && !localFileData}>Next</Button>
        ) : (
          <Button variant="contained" color="primary" onClick={onImport} disabled={!datasetName.trim() || isImporting}>
            {isImporting ? 'Importing...' : 'Import Dataset'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
