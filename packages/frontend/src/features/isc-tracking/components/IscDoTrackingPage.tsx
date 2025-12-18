import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { getUserFriendlyMessage } from '@/shared/utils/error-parser'
import {
  CheckCircle,
  Cancel,
  Inventory,
  QrCode,
  ShoppingCart,
  Calculate,
} from '@mui/icons-material'

import { PageHeader } from '@/shared/components/ui'

interface CheckResult {
  item_code: string
  avg_consume: number
  threshold: number
  total: number
  result: 'Yes' | 'No'
}

async function checkItem(data: { item_code: string; pick_to_light_stock: number; requested_quantity: number }) {
  const res = await fetch('/api/isc/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text()
    try {
      const err = JSON.parse(text)
      throw new Error(err.detail || 'Check failed')
    } catch {
      throw new Error(res.status === 500 ? 'Server error. Please try again.' : text || 'Check failed')
    }
  }
  return res.json() as Promise<CheckResult>
}

export default function IscDoTrackingPage() {
  const theme = useTheme()
  const [itemCode, setItemCode] = useState('')
  const [pickToLightStock, setPickToLightStock] = useState('')
  const [requestedQuantity, setRequestedQuantity] = useState('')

  const mutation = useMutation({ mutationFn: checkItem })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemCode.trim() || !pickToLightStock || !requestedQuantity) return
    mutation.mutate({
      item_code: itemCode.trim(),
      pick_to_light_stock: parseFloat(pickToLightStock),
      requested_quantity: parseFloat(requestedQuantity),
    })
  }

  const handleReset = () => {
    setItemCode('')
    setPickToLightStock('')
    setRequestedQuantity('')
    mutation.reset()
  }

  const isYes = mutation.data?.result === 'Yes'

  return (
    <Box p={3}>
      <PageHeader title="ISC - DO System" subtitle="Validate item requests against average consumption" />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Input Form */}
        <Box sx={{ flex: '1 1 400px', minWidth: 300 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calculate color="primary" /> Check Item
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Item Code"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  margin="normal"
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <QrCode color="action" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Enter item code..."
                />
                <TextField
                  fullWidth
                  label="Pick to Light Stock"
                  type="number"
                  value={pickToLightStock}
                  onChange={(e) => setPickToLightStock(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Inventory color="action" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ step: 'any', min: 0 }}
                  placeholder="Current stock..."
                />
                <TextField
                  fullWidth
                  label="Requested Quantity"
                  type="number"
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ShoppingCart color="action" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ step: 'any', min: 0 }}
                  placeholder="Quantity to request..."
                />
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={mutation.isPending || !itemCode || !pickToLightStock || !requestedQuantity}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {mutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Check Availability'}
                  </Button>
                  <Button type="button" variant="outlined" size="large" onClick={handleReset} sx={{ px: 4 }}>
                    Reset
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>

        {/* Result Panel */}
        <Box sx={{ flex: '1 1 400px', minWidth: 300 }}>
          <Card
            elevation={0}
            sx={{
              border: '2px solid',
              borderColor: mutation.isSuccess ? (isYes ? 'success.main' : 'error.main') : 'divider',
              height: '100%',
              bgcolor: mutation.isSuccess
                ? isYes
                  ? theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(46, 125, 50, 0.05)'
                  : theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)'
                : 'background.paper',
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Result
              </Typography>
              <Divider sx={{ my: 2 }} />

              {mutation.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {getUserFriendlyMessage(mutation.error)}
                </Alert>
              )}

              {!mutation.isSuccess && !mutation.isError && (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                  <Typography color="text.secondary" textAlign="center">
                    Enter item details and click "Check Availability"
                  </Typography>
                </Box>
              )}

              {mutation.isSuccess && (
                <Box sx={{ flex: 1 }}>
                  {/* Big Result */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      mb: 3,
                      textAlign: 'center',
                      bgcolor: isYes ? 'success.main' : 'error.main',
                      color: 'white',
                      borderRadius: 2,
                    }}
                  >
                    {isYes ? (
                      <CheckCircle sx={{ fontSize: 48, mb: 1 }} />
                    ) : (
                      <Cancel sx={{ fontSize: 48, mb: 1 }} />
                    )}
                    <Typography variant="h3" fontWeight={700}>
                      {mutation.data.result}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                      {isYes ? 'Request is within acceptable range' : 'Request exceeds threshold'}
                    </Typography>
                  </Paper>

                  {/* Details */}
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography color="text.secondary">Item Code</Typography>
                      <Typography fontWeight={600}>{mutation.data.item_code}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography color="text.secondary">Avg Consume</Typography>
                      <Typography fontWeight={600}>{mutation.data.avg_consume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography color="text.secondary">Threshold (2× Avg)</Typography>
                      <Typography fontWeight={600} color="primary">{mutation.data.threshold.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                      <Typography color="text.secondary">Total (Stock + Qty)</Typography>
                      <Typography fontWeight={600} color={isYes ? 'success.main' : 'error.main'}>
                        {mutation.data.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Formula */}
                  <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="body2" fontFamily="monospace">
                      {mutation.data.total.toLocaleString()} {isYes ? '≤' : '>'} {mutation.data.threshold.toLocaleString()}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
