import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TelegramIcon from '@mui/icons-material/Telegram';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useAuth } from '../services/Auth';
import { useSiteConfig } from '../context/SiteConfigContext';
import { VideoService, Video } from '../services/VideoService';
import VideoCard from '../components/VideoCard';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Backdrop from '@mui/material/Backdrop';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import jsPDF from 'jspdf';
import { useTheme } from '@mui/material/styles';

// Extend Video interface to include product_link
declare module '../services/VideoService' {
  interface Video {
    product_link?: string;
  }
}

// SVG icons for main cryptos
const cryptoIcons: Record<string, JSX.Element> = {
  BTC: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#f7931a"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">₿</text></svg>,
  ETH: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#3c3c3d"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">Ξ</text></svg>,
  USDT: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#26a17b"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">T</text></svg>,
  BNB: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#f3ba2f"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">BNB</text></svg>,
  SOL: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#66f9a1"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#222" fontWeight="bold">◎</text></svg>,
  XRP: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#23292f"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">XRP</text></svg>,
  ADA: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#0033ad"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">ADA</text></svg>,
  DOGE: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#c2a633"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">Ð</text></svg>,
  AVAX: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#e84142"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">A</text></svg>,
  DOT: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#e6007a"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">●</text></svg>,
  MATIC: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#8247e5"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">M</text></svg>,
  SHIB: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#f47321"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">S</text></svg>,
};

const VideoPlayer: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { telegramUsername, paypalClientId, cryptoWallets } = useSiteConfig();
  const [video, setVideo] = useState<Video | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [suggestedVideos, setSuggestedVideos] = useState<Video[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [copiedWalletIndex, setCopiedWalletIndex] = useState<number | null>(null);
  const theme = useTheme();

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
        // Reset purchase state when loading a new video
        setHasPurchased(false);
        setPurchaseComplete(false);
        setShowPurchaseModal(false);
        setPurchaseError(null);
        setPreviewUrl(null);

        // Get video details
        const videoData = await VideoService.getVideo(id);
        if (!videoData) {
          setError('Video not found');
          setLoading(false);
          return;
        }
        
        setVideo(videoData);
        
        // Increment view count
        await VideoService.incrementViews(id);

        // Get preview video URL (this is the preview that everyone can watch)
        try {
          // Pass the current user ID as the second parameter or a dummy ID if not logged in
          const url = await VideoService.getVideoFileUrl(id);
          console.log('Video URL obtained:', url);
          setPreviewUrl(url);
        } catch (err) {
          console.error('Error loading preview video:', err);
          // Don't set error, just log it - the thumbnail will be shown instead
        }
        
        // Check if user has purchased this video (only if logged in)
        if (user) {
          // Não precisamos mais verificar se o usuário comprou o vídeo
          // O fluxo de compra será sempre possível
          setHasPurchased(false);
          
          // Show purchase modal if it's the first time after purchase
          const justPurchased = sessionStorage.getItem(`purchased_${id}`);
          if (justPurchased) {
            // Make sure we only show the modal for the current video
            setShowPurchaseModal(true);
            // Clear the flag immediately to prevent showing the modal again
            sessionStorage.removeItem(`purchased_${id}`);
          }
        }
        
        // Load suggested videos (excluding current video)
        const allVideos = await VideoService.getAllVideos();
        const filtered = allVideos
          .filter(v => v.$id !== id)
          .slice(0, 8); // Limit to 8 videos
        setSuggestedVideos(filtered);
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Failed to load video. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [id, user]);

  const handleTelegramRedirect = () => {
    if (telegramUsername) {
      window.open(`https://t.me/${telegramUsername}`, '_blank');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    setShowOverlay(false);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
    // Don't show overlay when paused, as it might block controls
  };
  
  const handleVideoInteraction = () => {
    // Hide overlay when user interacts with the video
    setShowOverlay(false);
  };

  // Format duration (e.g., "1:30" to "1 min 30 sec")
  const formatDuration = (duration?: string | number) => {
    if (!duration) return 'Unknown';
    
    if (typeof duration === 'string') {
      // Parse MM:SS or HH:MM:SS format
      const parts = duration.split(':').map(Number);
      
        if (parts.length === 2) {
        // MM:SS format
        const [minutes, seconds] = parts;
        
        if (minutes === 0) {
          return `${seconds} sec`;
        } else if (seconds === 0) {
          return `${minutes} min`;
        } else {
          return `${minutes} min ${seconds} sec`;
        }
        } else if (parts.length === 3) {
        // HH:MM:SS format
        const [hours, minutes, seconds] = parts;
        
        if (hours === 0) {
          // No hours, format as minutes and seconds
          if (minutes === 0) {
            return `${seconds} sec`;
          } else if (seconds === 0) {
            return `${minutes} min`;
          } else {
            return `${minutes} min ${seconds} sec`;
          }
        } else {
          // Include hours
          if (minutes === 0 && seconds === 0) {
            return `${hours} hr`;
          } else if (seconds === 0) {
            return `${hours} hr ${minutes} min`;
          } else if (minutes === 0) {
            return `${hours} hr ${seconds} sec`;
          } else {
            return `${hours} hr ${minutes} min ${seconds} sec`;
          }
        }
      }
    }
    
    // If we can't parse it, just return as is
    return duration.toString();
  };

  // Format views with K/M suffix for thousands/millions
  const formatViews = (views?: number) => {
    if (views === undefined) return '0 views';
    
    if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    } else {
      return `${views} views`;
    }
  };

  // Format date to readable format
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Copy product link to clipboard
  const copyToClipboard = () => {
    if (video?.product_link) {
      navigator.clipboard.writeText(video.product_link)
        .then(() => {
      setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        })
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  // Generate PDF with product link
  const generatePDF = () => {
    if (!video) return;
    
    try {
    const doc = new jsPDF();
    
      // Set font size and styles
    doc.setFontSize(22);
      doc.setTextColor(229, 9, 20); // Netflix red
      doc.text("ADULTFLIX", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Purchase Receipt", 105, 30, { align: "center" });
    
      // Add horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);
      
      // Video details
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Video: ${video.title}`, 20, 50);
      doc.text(`Purchase Date: ${formatDate(new Date())}`, 20, 60);
      doc.text(`Price: $${video.price.toFixed(2)}`, 20, 70);
    
      // Product link section
      doc.setFontSize(14);
      doc.text("Your Product Link:", 20, 90);
      
      // Draw a box around the link
      doc.setDrawColor(229, 9, 20); // Netflix red
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(20, 95, 170, 20, 3, 3, 'FD');
    
      // Add the link text
    doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      if (video.product_link) {
        doc.text(video.product_link, 25, 107);
      } else {
        doc.text("Contact support via Telegram for access", 25, 107);
      }
    
      // Instructions
    doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text("Instructions:", 20, 130);
      
      if (video.product_link) {
        doc.text("1. Copy the link above and paste it in your browser", 25, 140);
        doc.text("2. The link will take you to your purchased content", 25, 150);
        doc.text("3. This link is for your personal use only", 25, 160);
        doc.text("4. Do not share this link with others", 25, 170);
      } else {
        doc.text("1. Contact support via Telegram to get access to your content", 25, 140);
        doc.text("2. Provide your purchase details when contacting support", 25, 150);
        doc.text("3. Support will provide you with access instructions", 25, 160);
      }
    
      // Footer
    doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("Thank you for your purchase!", 105, 200, { align: "center" });
      doc.text("© ADULTFLIX - All Rights Reserved", 105, 206, { align: "center" });
    
    // Save the PDF
      doc.save(`ADULTFLIX-Receipt-${video.title}.pdf`);
    setPdfGenerated(true);
      setTimeout(() => setPdfGenerated(false), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Create PayPal order
  const createOrder = (_: any, actions: any) => {
    if (!video) {
      setPurchaseError('Video information not available');
      return Promise.reject('Video information not available');
    }
    
    try {
    return actions.order.create({
      purchase_units: [
        {
            description: `Purchase of video: ${video.title}`,
          amount: {
              currency_code: 'USD',
              value: video.price.toString()
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      setPurchaseError('Failed to create payment order. Please try again.');
      return Promise.reject('Failed to create order');
    }
  };

  // Handle PayPal approval
  const onApprove = async (_: any, actions: any) => {
    try {
      // Capture the funds from PayPal
      const orderData = await actions.order.capture();
      console.log('Order data:', orderData);
      
      if (!video) {
        setPurchaseError('Video information not available');
        return;
      }
      
      // Usar um ID temporário se o usuário não estiver logado
      const userId = user ? user.$id : 'guest-' + Date.now();
      
      try {
        // Mostrar diretamente o modal de compra bem-sucedida
        // Não precisamos mais tentar registrar a compra no banco de dados
        setHasPurchased(true);
        setPurchaseComplete(true);
        setShowPurchaseModal(true);
        
        // Armazenar uma flag que acabamos de comprar este vídeo
        sessionStorage.setItem(`purchased_${video.$id}`, 'true');
      } catch (error) {
        console.error('Error processing payment:', error);
        setPurchaseError('Payment processing failed. Please try again later.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setPurchaseError('Payment processing failed. Please try again later.');
    }
  };

  const handleCloseModal = () => {
      setShowPurchaseModal(false);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '500px' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, px: 2 }}>
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
      </Box>
    );
  }

  const paypalOptions = {
    clientId: paypalClientId || "test",
    currency: "USD",
    intent: "capture",
  };

  return (
      <Box sx={{ 
      bgcolor: theme.palette.mode === 'dark' ? '#141414' : '#f5f5f5', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
        width: '100%', 
      overflow: 'hidden' 
    }}>
      {/* Video player section */}
      <Box sx={{ width: '100%', bgcolor: '#000' }}>
        <Box sx={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          position: 'relative'
        }}>
          {previewUrl ? (
            // Native browser player
            <Box sx={{ 
              width: '100%',
              height: '500px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#000'
            }}>
              <video 
                controls 
                autoPlay={false}
              poster={video?.thumbnailUrl}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
                onClick={handleVideoInteraction}
                onMouseOver={handleVideoInteraction}
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '1200px',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  zIndex: 1000 /* Ensure video controls are above overlay */
                }}
              >
                <source src={previewUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Box>
          ) : (
            // Show only the thumbnail if no video URL
            <Box sx={{ 
              width: '100%',
              height: '500px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#000',
              position: 'relative'
            }}>
            <CardMedia
              component="img"
              image={video?.thumbnailUrl || 'https://via.placeholder.com/1280x720?text=Video+Preview'}
              alt={video?.title}
              sx={{ 
                width: '100%',
                height: '100%',
                  objectFit: 'contain',
                  maxWidth: '1200px'
              }}
            />
            
              {/* Purchase overlay */}
              {showOverlay && (
            <Box
              sx={{
                position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 3,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                  color: 'white',
                display: 'flex',
                  justifyContent: 'space-between',
                alignItems: 'center',
                  zIndex: 999
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {video?.title || 'Video Details'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">
                        {video?.duration ? formatDuration(video.duration) : 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VisibilityIcon fontSize="small" />
                      <Typography variant="body2">
                        {formatViews(video?.views)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#E50914' }}>
                  ${video?.price.toFixed(2)}
                </Typography>
              </Box>
              )}
            </Box>
          )}
          
          {/* Title overlay (only shown when not interacting with video) */}
          {previewUrl && showOverlay && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 3,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 998, /* Below the video controls */
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {video?.title || 'Video Details'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon fontSize="small" />
                    <Typography variant="body2">
                      {video?.duration ? formatDuration(video.duration) : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VisibilityIcon fontSize="small" />
                    <Typography variant="body2">
                      {formatViews(video?.views)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#E50914' }}>
                ${video?.price.toFixed(2)}
              </Typography>
            </Box>
          )}
          </Box>
      </Box>
      
      {/* Content section */}
      <Box sx={{ 
        width: '100%', 
        maxWidth: '1200px', 
        color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary, 
        mt: 6, 
        px: { xs: 2, md: 4 } 
      }}>
        <Box sx={{ mb: 6 }}>
          {purchaseComplete && !showPurchaseModal && (
          <Alert severity="success" sx={{ mb: 3 }}>
              Purchase successful! Click here to <Button color="inherit" onClick={() => setShowPurchaseModal(true)}>view your product link</Button>.
          </Alert>
        )}
        
        {purchaseError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {purchaseError}
          </Alert>
        )}
        
        {/* Back button */}
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mb: 3 }}
        >
          Back to Videos
        </Button>
        
        {/* Video description */}
        <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ 
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary, 
              mt: 2 
            }}>
              {video?.title || 'Video Details'}
            </Typography>
          
          <Typography variant="body1" paragraph sx={{ 
            color: theme.palette.mode === 'dark' ? '#ccc' : theme.palette.text.secondary, 
            mt: 2 
          }}>
            {video?.description}
          </Typography>
          
            {/* Payment Options */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center', color: theme.palette.mode === 'dark' ? '#fff' : '#222' }}>
                Payment Options
              </Typography>
              <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
                {/* PayPal Button - Show if not purchased and PayPal client ID is available */}
              {paypalClientId && !hasPurchased && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ width: '100%' }}>
                  <PayPalScriptProvider options={paypalOptions}>
                    <PayPalButtons
                      style={{ layout: "vertical", height: 55 }}
                      createOrder={(data, actions) => createOrder(data, actions)}
                      onApprove={(data, actions) => onApprove(data, actions)}
                    />
                  </PayPalScriptProvider>
                </Box>
                  </Grid>
              )}
              
                {/* Product Link Button - Show if purchased */}
              {hasPurchased && (
                  <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setShowPurchaseModal(true)}
                  startIcon={<CheckCircleIcon />}
                      sx={{ width: '100%', py: 1.5, fontWeight: 'bold', fontSize: 16 }}
                    >
                      View Product Link
                    </Button>
                  </Grid>
                )}
                
                {/* Crypto Button - Show if crypto wallets are available */}
                {cryptoWallets.length > 0 && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<MonetizationOnIcon />}
                      onClick={() => setShowCryptoModal(true)}
                  sx={{ 
                        py: 1.5,
                        borderColor: '#26a17b',
                        color: '#26a17b',
                        fontWeight: 'bold',
                        fontSize: 16,
                        '&:hover': {
                          borderColor: '#1e1e1e',
                          color: '#fff',
                          background: '#26a17b',
                        }
                      }}
                    >
                      Pay with Crypto
                </Button>
                  </Grid>
              )}
              
                {/* Telegram Button - Show if telegram username is available */}
              {telegramUsername && (
                  <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<TelegramIcon />}
                  onClick={handleTelegramRedirect}
                  sx={{ 
                    py: 1.5,
                        borderColor: '#229ED9',
                        color: '#229ED9',
                        fontWeight: 'bold',
                        fontSize: 16,
                    '&:hover': {
                          borderColor: '#229ED9',
                          color: '#fff',
                          background: '#229ED9',
                    }
                  }}
                >
                  Contact on Telegram
                </Button>
                  </Grid>
              )}
              </Grid>
            </Box>
        </Box>
        
        {/* Suggested Videos Section */}
        {suggestedVideos.length > 0 && (
          <>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 6, mb: 3, color: 'white' }}>
              More Like This
            </Typography>
            
            <Grid container spacing={3}>
              {suggestedVideos.map((suggestedVideo) => (
                <Grid item key={suggestedVideo.$id} xs={12} sm={6} md={3}>
                  <VideoCard video={suggestedVideo} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
        </Box>
      </Box>
      
      {/* Purchase Success Modal */}
      <Modal
        open={showPurchaseModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        aria-labelledby="purchase-success-modal"
        aria-describedby="modal-with-product-link"
      >
        <Fade in={showPurchaseModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '500px' },
            bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : theme.palette.background.paper,
            border: '2px solid #E50914',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                Purchase Successful!
              </Typography>
              <IconButton 
                onClick={handleCloseModal} 
                sx={{ color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary }}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              Thank you for your purchase! Here is your product link:
            </Typography>
            
            {video?.product_link ? (
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={video.product_link}
                  InputProps={{
                    readOnly: true,
                    sx: { 
                      color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color={copied ? "success" : "primary"}
                  onClick={copyToClipboard}
                  startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 4 }}>
                Your purchase was successful! The admin will need to update the product link. 
                Please contact support through Telegram for immediate access.
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {video?.product_link && (
                <Button
                  variant="contained"
                  color={pdfGenerated ? "success" : "secondary"}
                  fullWidth
                  startIcon={pdfGenerated ? <CheckCircleIcon /> : <PictureAsPdfIcon />}
                  onClick={generatePDF}
                >
                  {pdfGenerated ? 'PDF Downloaded!' : 'Download Receipt PDF'}
                </Button>
              )}
              
              {telegramUsername && (
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<TelegramIcon />}
                  onClick={handleTelegramRedirect}
                  sx={{ 
                    borderColor: '#229ED9',
                    color: '#229ED9',
                    '&:hover': {
                      borderColor: '#229ED9',
                      color: '#fff',
                      background: '#229ED9',
                    }
                  }}
                >
                  Contact on Telegram
                </Button>
              )}
              
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'dark' ? '#aaa' : theme.palette.text.secondary, 
                textAlign: 'center', 
                mt: 2 
              }}>
                {video?.product_link 
                  ? 'Please save your product link and download the receipt PDF before closing this window.'
                  : 'Your purchase has been recorded. Please contact support for access to your content.'}
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Modal>
      
      {/* Crypto Wallets Modal */}
      <Modal
        open={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
        aria-labelledby="crypto-wallets-modal"
        aria-describedby="modal-with-crypto-wallets"
      >
        <Fade in={showCryptoModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: 420 },
            bgcolor: theme.palette.mode === 'dark' ? '#181818' : '#fff',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Pay with Crypto
              </Typography>
              <IconButton onClick={() => setShowCryptoModal(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ mb: 3, color: theme.palette.mode === 'dark' ? '#aaa' : '#555' }}>
              Choose one of the wallets below to make your payment. <br />
              <b>After payment, send your proof of payment via Telegram for manual confirmation.</b>
            </Typography>
            {cryptoWallets.map((wallet, idx) => {
              // Parse wallet: "CODE - Name\naddress"
              const [header, address] = wallet.split('\n');
              const [code, name] = header.split(' - ');
              return (
                <Box key={idx} sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                  p: 2,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? '#333' : '#eee',
                  borderRadius: 2,
                  background: theme.palette.mode === 'dark' ? '#232323' : '#fafafa',
                }}>
                  <Box sx={{ minWidth: 40 }}>{cryptoIcons[code] || <MonetizationOnIcon fontSize="large" />}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{name || code}</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', color: theme.palette.mode === 'dark' ? '#fff' : '#222' }}>{address}</Typography>
                  </Box>
                  <Button
                    variant={copiedWalletIndex === idx ? 'contained' : 'outlined'}
                    color={copiedWalletIndex === idx ? 'success' : 'primary'}
                    size="small"
                    startIcon={copiedWalletIndex === idx ? <CheckCircleIcon /> : <ContentCopyIcon />}
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      setCopiedWalletIndex(idx);
                      setTimeout(() => setCopiedWalletIndex(null), 2000);
                    }}
                    sx={{ minWidth: 90 }}
                  >
                    {copiedWalletIndex === idx ? 'Copied!' : 'Copy'}
                  </Button>
                </Box>
              );
            })}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<TelegramIcon />}
                onClick={handleTelegramRedirect}
              >
                Contact on Telegram
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default VideoPlayer;
