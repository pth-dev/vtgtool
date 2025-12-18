import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { Box, Chip, Paper, Typography, useTheme } from '@mui/material'

interface Column {
  name: string
  detected_type?: string
}

interface Props {
  columns: Column[]
  data: Record<string, any>[]
  rowHeight?: number
  headerHeight?: number
  maxHeight?: number
}

const TYPE_COLORS: Record<string, string> = {
  string: '#1976d2',
  number: '#2e7d32',
  date: '#ed6c02',
  boolean: '#0288d1',
}

const Row = memo(
  ({
    row,
    columns,
    style,
    isDark,
  }: {
    row: Record<string, any>
    columns: Column[]
    style: React.CSSProperties
    isDark: boolean
  }) => (
    <Box
      sx={{
        display: 'flex',
        ...style,
        borderBottom: '1px solid',
        borderColor: isDark ? '#27272a' : '#eee',
        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5' },
      }}
    >
      {columns.map((col, j) => (
        <Box
          key={j}
          sx={{
            flex: 1,
            minWidth: 120,
            maxWidth: 200,
            px: 1,
            py: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <Typography variant="body2" noWrap>
            {row[col.name] === null ? (
              <em style={{ color: '#999' }}>null</em>
            ) : (
              String(row[col.name])
            )}
          </Typography>
        </Box>
      ))}
    </Box>
  )
)

export const VirtualizedTable = memo(function VirtualizedTable({
  columns,
  data,
  rowHeight = 36,
  headerHeight = 44,
  maxHeight = 500,
}: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(maxHeight)

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(Math.min(maxHeight, containerRef.current.clientHeight))
    }
  }, [maxHeight])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const visibleRows = Math.ceil(containerHeight / rowHeight) + 2
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 1)
  const endIndex = Math.min(data.length, startIndex + visibleRows)
  const visibleData = data.slice(startIndex, endIndex)
  const offsetY = startIndex * rowHeight

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: isDark ? '#1a1a1a' : 'grey.100',
          borderBottom: '2px solid',
          borderColor: isDark ? '#27272a' : '#ddd',
          height: headerHeight,
        }}
      >
        {columns.map((col, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              minWidth: 120,
              maxWidth: 200,
              px: 1,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Typography variant="body2" fontWeight={600} noWrap>
              {col.name}
            </Typography>
            {col.detected_type && (
              <Chip
                label={col.detected_type}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 10,
                  bgcolor: TYPE_COLORS[col.detected_type] || '#666',
                  color: '#fff',
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Body with virtualization */}
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{ height: maxHeight - headerHeight, overflow: 'auto' }}
      >
        <Box sx={{ height: data.length * rowHeight, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
            {visibleData.map((row, i) => (
              <Row key={startIndex + i} row={row} columns={columns} style={{ height: rowHeight }} isDark={isDark} />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  )
})
