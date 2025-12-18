import type { Components, Theme } from '@mui/material/styles'

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: { backgroundImage: 'none' },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: 'none',
        ...theme.applyStyles('dark', {
          backgroundColor: '#171717',
          borderColor: '#27272a',
        }),
      }),
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { textTransform: 'none', fontWeight: 500 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { fontWeight: 500 },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.applyStyles('dark', {
          borderColor: '#27272a',
        }),
      }),
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        ...theme.applyStyles('dark', {
          backgroundColor: '#171717',
          backgroundImage: 'none',
        }),
      }),
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        ...theme.applyStyles('dark', {
          backgroundColor: '#0a0a0a',
          borderColor: '#27272a',
        }),
      }),
    },
  },
}
