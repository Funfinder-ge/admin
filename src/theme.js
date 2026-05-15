import { createTheme, alpha } from '@mui/material/styles';

const brand = {
  50: '#FCEEF2',
  100: '#F6D1DC',
  200: '#E89BB1',
  300: '#D86B8C',
  400: '#B83E66',
  500: '#87003A',
  600: '#6E0030',
  700: '#560024',
  800: '#3D000F',
  900: '#26000A',
};

const slate = {
  50: '#F7F8FA',
  100: '#EEF0F4',
  200: '#E2E5EC',
  300: '#CBD0DA',
  400: '#94A0B3',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1F2937',
  900: '#0B1220',
};

const success = '#16A34A';
const warning = '#F59E0B';
const errorRed = '#DC2626';
const info = '#0EA5E9';

const fontStack = '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand[500],
      light: brand[300],
      dark: brand[700],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: slate[800],
      light: slate[600],
      dark: slate[900],
      contrastText: '#FFFFFF',
    },
    success: { main: success, contrastText: '#FFFFFF' },
    warning: { main: warning, contrastText: '#1F2937' },
    error: { main: errorRed, contrastText: '#FFFFFF' },
    info: { main: info, contrastText: '#FFFFFF' },
    background: {
      default: slate[50],
      paper: '#FFFFFF',
    },
    text: {
      primary: slate[900],
      secondary: slate[500],
      disabled: slate[400],
    },
    divider: slate[200],
    brand,
    slate,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: fontStack,
    fontSize: 14,
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 700, letterSpacing: '-0.015em', fontSize: '1.75rem' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em', fontSize: '1.35rem' },
    h6: { fontWeight: 700, fontSize: '1.05rem' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
    overline: { letterSpacing: '0.08em', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: slate[50],
          color: slate[900],
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: slate[200],
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '*::-webkit-scrollbar-thumb:hover': { background: slate[300] },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: slate[900],
          borderBottom: `1px solid ${slate[200]}`,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: slate[200],
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${slate[200]}`,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          transition: 'box-shadow .18s ease, transform .18s ease, border-color .18s ease',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 20, '&:last-child': { paddingBottom: 20 } },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 16px',
          fontWeight: 600,
        },
        sizeSmall: { padding: '5px 12px' },
        sizeLarge: { padding: '11px 22px' },
        containedPrimary: {
          boxShadow: `0 1px 2px ${alpha(brand[500], 0.25)}`,
          '&:hover': { boxShadow: `0 4px 12px ${alpha(brand[500], 0.3)}` },
        },
        outlined: {
          borderColor: slate[200],
          '&:hover': { borderColor: slate[300], backgroundColor: slate[50] },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          height: 26,
        },
        filled: {
          backgroundColor: slate[100],
          color: slate[800],
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          '& fieldset': { borderColor: slate[200] },
          '&:hover fieldset': { borderColor: slate[300] },
          '&.Mui-focused fieldset': { borderColor: brand[500], borderWidth: 1.5 },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${slate[200]}`,
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: slate[50],
          '& .MuiTableCell-root': {
            fontWeight: 700,
            color: slate[600],
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderBottom: `1px solid ${slate[200]}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${slate[100]}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: alpha(brand[500], 0.03) },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${slate[200]}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid transparent`,
        },
        standardSuccess: { backgroundColor: alpha(success, 0.08), color: '#14532D', borderColor: alpha(success, 0.2) },
        standardWarning: { backgroundColor: alpha(warning, 0.1), color: '#78350F', borderColor: alpha(warning, 0.25) },
        standardError: { backgroundColor: alpha(errorRed, 0.08), color: '#7F1D1D', borderColor: alpha(errorRed, 0.2) },
        standardInfo: { backgroundColor: alpha(info, 0.08), color: '#0C4A6E', borderColor: alpha(info, 0.2) },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: slate[900],
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '6px 10px',
        },
        arrow: { color: slate[900] },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: slate[200] },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, height: 6, backgroundColor: slate[100] },
        bar: { borderRadius: 999 },
      },
    },
  },
});

export default theme;
