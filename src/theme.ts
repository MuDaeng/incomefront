import { createTheme } from '@mui/material/styles';
import { koKR } from '@mui/material/locale';

export const theme = createTheme(
  {
    cssVariables: { colorSchemeSelector: 'class' },
    colorSchemes: {
      light: {
        palette: {
          primary: { main: '#1B7F5C' },
          secondary: { main: '#C77D1A' },
          background: { default: '#F5F7F6', paper: '#FFFFFF' },
        },
      },
      dark: {
        palette: {
          primary: { main: '#4CC79A' },
          secondary: { main: '#F0A64A' },
          background: { default: '#0F1412', paper: '#171E1B' },
        },
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiTableCell: {
        styleOverrides: {
          root: { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
          head: { fontWeight: 600 },
        },
      },
    },
  },
  koKR,
);
