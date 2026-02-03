import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme as useMuiTheme,
} from '@mui/material'
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
  Notifications,
  Person,
  ExitToApp,
} from '@mui/icons-material'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const ModernHeader = ({ onMenuClick }) => {
  const { mode, toggleTheme } = useTheme()
  const theme = useMuiTheme()
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [unreadCount, setUnreadCount] = React.useState(0)

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
    navigate('/')
  }

  React.useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem('aarogini.notifications')
      if (!stored) return setUnreadCount(0)
      try {
        const items = JSON.parse(stored)
        setUnreadCount(items.filter(i => !i.read).length)
      } catch {
        setUnreadCount(0)
      }
    }
    load()
    window.addEventListener('notificationsUpdated', load)
    return () => window.removeEventListener('notificationsUpdated', load)
  }, [])

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: mode === 'light' 
          ? 'linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)'
          : 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link to={isAuthenticated ? "/landing" : "/"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src="/logooo.png"
              alt="Aarogini"
              sx={{ width: 40, height: 40, borderRadius: 2, mr: 1 }}
            />
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                background: mode === 'light'
                  ? 'linear-gradient(45deg, #18181b 30%, #ec4899 90%)'
                  : 'linear-gradient(45deg, #fafafa 30%, #f472b6 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}
            >
              Aarogini
            </Typography>
          </Link>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>

          {isAuthenticated ? (
            <>
              <Tooltip title="Notifications">
                <IconButton color="inherit" sx={{ position: 'relative' }}>
                  <Notifications />
                  {unreadCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: '#ec4899',
                        color: 'white',
                        fontSize: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {unreadCount}
                    </Box>
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Account settings">
                <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
                  <Avatar
                    sx={{
                      width: 35,
                      height: 35,
                      bgcolor: mode === 'light' ? '#f472b6' : '#ec4899',
                      border: '2px solid',
                      borderColor: mode === 'light' ? '#fda4af' : '#f9a8d4',
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                  <Person sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                onClick={() => navigate('/login')}
                variant="text"
                sx={{ color: mode === 'light' ? '#6b21a8' : '#f3e8ff', fontWeight: 600 }}
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                variant="contained"
                sx={{
                  bgcolor: 'linear-gradient(90deg, #7c3aed 0%, #ec4899 100%)',
                  background: 'linear-gradient(90deg, #7c3aed 0%, #ec4899 100%)',
                  color: 'white',
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  boxShadow: '0 10px 20px rgba(236,72,153,0.2)'
                }}
              >
                Sign up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default ModernHeader
