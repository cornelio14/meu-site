import type { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import { useSiteConfig } from '../context/SiteConfigContext';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';

const Footer: FC = () => {
  const currentYear = new Date().getFullYear();
  const theme = useTheme();
  const { siteName } = useSiteConfig();
  
  const handleBuyTemplate = () => {
    window.open('https://t.me/admUnlock', '_blank');
  };
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 5, 
        bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: 4
      }}
    >
      <Container>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" color="text.primary" gutterBottom>
                {siteName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We offer the best premium content for our users. 
                All videos are carefully selected to ensure 
                the highest quality content.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Useful Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link 
                href="/" 
                underline="hover" 
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Home
              </Link>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: theme.palette.text.secondary,
                  mt: 1
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  18+ Content
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              About
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This website is for adults 18 years or older only.
              All content is protected by copyright.
            </Typography>
            {/* <Button 
              variant="outlined" 
              size="small"
              color="primary"
              onClick={handleBuyTemplate}
              sx={{ 
                mt: 1,
                fontSize: '0.75rem',
                opacity: 0.7,
                '&:hover': {
                  opacity: 1
                }
              }}
            >
              Buy this template
            </Button> */}
          </Grid>
        </Grid>
        
        <Box 
          sx={{ 
            borderTop: `1px solid ${theme.palette.divider}`,
            mt: 4,
            pt: 3,
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} {siteName}. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 1, md: 0 } }}>
            Designed with ❤️ for premium content
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
