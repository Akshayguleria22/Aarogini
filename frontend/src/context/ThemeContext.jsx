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
    return savedMode || 'dark' // Default to dark
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
                  main: '#E91E63', // Pink for women's health
                  light: '#F06292',
                  dark: '#C2185B',
                  contrastText: '#fff',
                },
                secondary: {
                  main: '#9C27B0', // Purple
                  light: '#BA68C8',
                  dark: '#7B1FA2',
                  contrastText: '#fff',
                },
                background: {
                  default: '#F8F9FA',
                  paper: '#FFFFFF',
                },
                text: {
                  primary: '#1A1A1A',
                  secondary: '#666666',
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
                  main: '#F06292', // Lighter pink for dark mode
                  light: '#F48FB1',
                  dark: '#E91E63',
                  contrastText: '#000',
                },
                secondary: {
                  main: '#BA68C8', // Lighter purple
                  light: '#CE93D8',
                  dark: '#9C27B0',
                  contrastText: '#000',
                },
                background: {
                  default: '#121212',
                  paper: '#1E1E1E',
                },
                text: {
                  primary: '#FFFFFF',
                  secondary: '#B0B0B0',
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
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            lineHeight: 1.4,
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            lineHeight: 1.5,
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.6,
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
