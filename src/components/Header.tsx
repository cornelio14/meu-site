import { useContext } from 'react';
import type { FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../services/Auth';
import { useSiteConfig } from '../context/SiteConfigContext';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

const Header: FC = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const { user, logout, isAuthenticated } = useAuth();
  const { siteName } = useSiteConfig();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear session if logout fails
      localStorage.removeItem('sessionToken');
      window.location.reload();
    }
  };

  // Only show admin/logout if authenticated
  const showAdminControls = isAuthenticated && user;

  return (
    <AppBar 
      position="sticky"
      sx={{
        bgcolor: mode === 'dark' ? 'primary.main' : 'primary.main',
        color: '#fff'
      }}
    >
      <Toolbar>
        {/* Site Logo/Name */}
        <Box
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: 'linear-gradient(to right, #E50914 0%, #B20710 100%)',
              borderRadius: '4px',
              px: 1.5,
              py: 0.5,
              mr: 1,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.2px',
                fontFamily: "'Roboto', sans-serif",
                fontSize: { xs: '0.9rem', sm: '1.1rem' },
                color: 'white',
              }}
            >
              {siteName.split(' ')[0]}
              <Box 
                component="span" 
                sx={{ 
                  color: 'white',
                  fontWeight: 400,
                  ml: 0.5
                }}
              >
                {siteName.split(' ').slice(1).join(' ')}
              </Box>
            </Typography>
          </Box>
        </Box>
        
        {/* Theme Toggle
        <IconButton 
          color="inherit" 
          onClick={toggleTheme} 
          sx={{ 
            mr: 1,
            color: '#fff'
          }}
          aria-label="toggle theme"
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton> */}
        
        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/"
            sx={{ 
              mr: 1,
              color: '#fff',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Home
          </Button>
          
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/videos"
            sx={{ 
              mr: 1,
              color: '#fff',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Videos
          </Button>
          
          {/* Show admin button if authenticated */}
          {showAdminControls && (
            <>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/admin"
                startIcon={<PersonIcon />}
                sx={{ 
                  mr: 1,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Admin
              </Button>
              
              <IconButton 
                color="inherit" 
                onClick={handleLogout}
                sx={{ color: '#fff' }} 
                aria-label="logout"
              >
                <LogoutIcon />
              </IconButton>
            </>
          )}
          
         
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
