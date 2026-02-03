import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode')
    return savedMode || 'light'
  })

  useEffect(() => {
    localStorage.setItem('themeMode', mode)
    // Add/remove dark class from document
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(mode)
  }, [mode])

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
  }

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode
                primary: {
                  main: '#2bb3a2',
                  light: '#4fc7b8',
                  dark: '#1f9f90',
                  contrastText: '#fff',
                },
                secondary: {
                  main: '#f47c6b',
                  light: '#f79a8e',
                  dark: '#e66555',
                  contrastText: '#fff',
                },
                background: {
                  default: '#f7f3ee',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#1f2a2e',
                  secondary: '#5f6b6f',
                },
                success: {
                  main: '#4CAF50',
                },
                warning: {
                  main: '#FF9800',
                },
                error: {
                  main: '#F44336',
                },
                info: {
                  main: '#2196F3',
                },
              }
            : {
                // Dark mode
                primary: {
                  main: '#2bb3a2',
                  light: '#4fc7b8',
                  dark: '#1f9f90',
                  contrastText: '#000',
                },
                secondary: {
                  main: '#f47c6b',
                  light: '#f79a8e',
                  dark: '#e66555',
                  contrastText: '#000',
                },
                background: {
                  default: '#0f1515',
                  paper: '#182022',
                },
                text: {
                  primary: '#fdf6ef',
                  secondary: '#c9c3ba',
                },
                success: {
                  main: '#66BB6A',
                },
                warning: {
                  main: '#FFA726',
                },
                error: {
                  main: '#EF5350',
                },
                info: {
                  main: '#42A5F5',
                },
              }),
        },
        typography: {
          fontFamily: '"Manrope", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
            fontFamily: '"Fraunces", serif',
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
            fontFamily: '"Fraunces", serif',
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
            fontFamily: '"Fraunces", serif',
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            lineHeight: 1.4,
            fontFamily: '"Fraunces", serif',
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            lineHeight: 1.5,
            fontFamily: '"Fraunces", serif',
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.6,
            fontFamily: '"Fraunces", serif',
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
          },
          button: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 500,
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === 'light' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.08)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0 2px 4px rgba(0, 0, 0, 0.06)'
                  : '0 2px 4px rgba(0, 0, 0, 0.3)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
        },
      }),
    [mode]
  )

  const value = {
    mode,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  )
}
