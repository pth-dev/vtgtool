import { Add, Search } from '@mui/icons-material'
import { Box, Button, Card, CardContent, InputAdornment, TextField } from '@mui/material'

import { DataPreview } from '@/features/data-manager/components'
import { PageHeader } from '@/shared/components/ui'
import { DatasetTable, ImportWizard } from '@/features/data-manager/components'
import { useDataManager } from '@/features/data-manager/hooks'
import { ContentDialog, NotificationSnackbar } from '@/shared/components/ui'
import { useConfirm } from '@/shared/stores'
import type { Dataset } from '@/types'

export default function DataManagerPage() {
  const dm = useDataManager()
  const confirm = useConfirm()

  const handleDelete = (dataset: Dataset) => {
    confirm({
      title: 'Delete Dataset',
      message: `Are you sure you want to delete "${dataset.name}"? This will permanently remove the dataset and cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: 'error',
      onConfirm: async () => {
        dm.handleDeleteDataset(dataset.id)
      },
    })
  }

  return (
    <Box p={3}>
      <PageHeader
        title="Data Sources"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={dm.openImportDialog}>
            Import Data
          </Button>
        }
      />

      <Card>
        <CardContent>
          {/* Search */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search datasets..."
              value={dm.search}
              onChange={(e) => dm.setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Table */}
          <DatasetTable
            datasets={dm.datasets}
            totalCount={dm.totalCount}
            page={dm.page}
            rowsPerPage={dm.rowsPerPage}
            isLoading={dm.isLoading}
            onPageChange={dm.setPage}
            onRowsPerPageChange={dm.setRowsPerPage}
            onPreview={dm.setPreviewDataset}
            onDelete={handleDelete}
            onImport={dm.openImportDialog}
          />
        </CardContent>
      </Card>

      {/* Import Wizard Dialog */}
      <ImportWizard
        open={dm.importDialogOpen}
        activeStep={dm.activeStep}
        localFileData={dm.localFileData}
        datasetName={dm.datasetName}
        dataType={dm.dataType}
        isImporting={dm.isImporting}
        onClose={dm.closeImportDialog}
        onFileSelected={dm.handleFileSelected}
        onFileError={(err) => console.error(err)}
        onNext={dm.handleNextStep}
        onBack={dm.handleBackStep}
        onDatasetNameChange={dm.setDatasetName}
        onDataTypeChange={dm.setDataType}
        onImport={dm.handleCreateDataset}
      />

      {/* Preview Dialog */}
      <ContentDialog
        open={!!dm.previewDataset}
        title={`Preview: ${dm.previewDataset?.name || ''}`}
        maxWidth="lg"
        onClose={() => dm.setPreviewDataset(null)}
        actions={<Button onClick={() => dm.setPreviewDataset(null)}>Close</Button>}
      >
        {dm.previewDataset && <DataPreview datasetId={dm.previewDataset.id} />}
      </ContentDialog>

      {/* Notifications */}
      {dm.notification && (
        <NotificationSnackbar
          open={!!dm.notification}
          message={dm.notification.message}
          type={dm.notification.type}
          onClose={dm.clearNotification}
        />
      )}
    </Box>
  )
}
