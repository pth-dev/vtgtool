import { createTheme as createMuiTheme, type Theme } from '@mui/material/styles'
import { lightPalette, darkPalette } from './palette'
import { components } from './components'

const baseTheme = {
  typography: { fontFamily: '"Inter", "Roboto", sans-serif' },
  shape: { borderRadius: 8 },
  components,
}

export const lightTheme: Theme = createMuiTheme({
  ...baseTheme,
  palette: lightPalette,
})

export const darkTheme: Theme = createMuiTheme({
  ...baseTheme,
  palette: darkPalette,
})

export function getTheme(mode: 'light' | 'dark'): Theme {
  return mode === 'dark' ? darkTheme : lightTheme
}
