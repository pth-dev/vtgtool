import { Box, CircularProgress, Typography } from '@mui/material'

interface Props {
  message?: string
}

export default function PageLoader({ message = 'Loading...' }: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="50vh"
      gap={2}
    >
      <CircularProgress size={40} />
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </Box>
  )
}
