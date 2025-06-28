import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { VideoService, Video } from '../services/VideoService';

const PurchasePage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  useEffect(() => {
    const loadVideo = async () => {
      if (!id) {
        setError('Invalid video ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get video details
        const videoData = await VideoService.getVideo(id);
        if (!videoData) {
          setError('Video not found');
          setLoading(false);
          return;
        }
        
        setVideo(videoData);
      } catch (err) {
        console.error('Error loading video:', err);
        setError('An error occurred while loading the video');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [id]);

  const handlePurchase = async () => {
    if (!video) {
      setPurchaseError('Video information not available');
      return;
    }

    try {
      setPurchaseLoading(true);
      setPurchaseError(null);

      // Simular processamento de compra
      // Na vida real, aqui chamaria o gateway de pagamento
      setTimeout(() => {
        setPurchaseComplete(true);
        setPurchaseLoading(false);
      }, 1500);
    } catch (err) {
      console.error('Purchase error:', err);
      setPurchaseError('Failed to complete purchase. Please try again.');
      setPurchaseLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleWatchNow = () => {
    navigate(`/videoplayer/${id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        Back to videos
      </Button>
      
      {purchaseComplete && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Purchase successful! You can now watch this video.
        </Alert>
      )}
      
      {purchaseError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {purchaseError}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {video?.title || 'Video Details'}
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardMedia
                component="img"
                image={video?.thumbnailUrl || 'https://via.placeholder.com/600x400?text=Video+Thumbnail'}
                alt={video?.title}
                sx={{ height: 300, objectFit: 'cover' }}
              />
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Video Information
            </Typography>
            
            <Typography variant="body1" paragraph>
              {video?.description}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Duration: {video?.duration || 'N/A'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="p" color="primary" sx={{ fontWeight: 'bold' }}>
                ${video?.price.toFixed(2)}
              </Typography>
            </Box>
            
            {purchaseComplete ? (
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={<PlayArrowIcon />}
                onClick={handleWatchNow}
              >
                Watch Now
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={handlePurchase}
                disabled={purchaseLoading}
              >
                {purchaseLoading ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Purchase Now'
                )}
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PurchasePage; 