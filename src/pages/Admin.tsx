import { useState, useEffect, useRef, ChangeEvent } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/Auth';
import { VideoService } from '../services/VideoService';
import { ID } from 'appwrite';
import { useSiteConfig } from '../context/SiteConfigContext';
import { databases, databaseId, storage, videoCollectionId, siteConfigCollectionId, userCollectionId, videosBucketId, thumbnailsBucketId } from '../services/node_appwrite';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import React from 'react';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Styled components for file upload
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Custom Alert component
const CustomAlert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Video interface
interface Video {
  $id: string;
  title: string;
  description: string;
  price: number;
  product_link?: string;
  video_id?: string;
  thumbnail_id?: string;
  created_at: string;
  is_active: boolean;
  duration?: number;
}

// User interface
interface User {
  $id: string;
  email: string;
  name: string;
  password: string;
  created_at: string;
}

// Site config interface
interface SiteConfig {
  $id: string;
  site_name: string;
  paypal_client_id: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  telegram_username: string;
  video_list_title?: string;
  crypto?: string[];
}

// Admin page component
const Admin: FC = () => {
  const { user } = useAuth();
  const { refreshConfig } = useSiteConfig();
  const [tabValue, setTabValue] = useState(0);
  
  // Videos state
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Video form state
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoPrice, setVideoPrice] = useState('');
  const [productLink, setProductLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  
  // Site config state
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [siteName, setSiteName] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [videoListTitle, setVideoListTitle] = useState('');
  const [cryptoWallets, setCryptoWallets] = useState<string[]>([]);
  const [newCryptoWallet, setNewCryptoWallet] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [editingConfig, setEditingConfig] = useState(false);
  
  // Available cryptocurrencies
  const cryptoCurrencies = [
    { code: 'BTC', name: 'Bitcoin' },
    { code: 'ETH', name: 'Ethereum' },
    { code: 'USDT', name: 'Tether USD' },
    { code: 'BNB', name: 'Binance Coin' },
    { code: 'SOL', name: 'Solana' },
    { code: 'XRP', name: 'Ripple' },
    { code: 'ADA', name: 'Cardano' },
    { code: 'DOGE', name: 'Dogecoin' },
    { code: 'AVAX', name: 'Avalanche' },
    { code: 'DOT', name: 'Polkadot' },
    { code: 'MATIC', name: 'Polygon' },
    { code: 'SHIB', name: 'Shiba Inu' }
  ];
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'video' | 'user', id: string } | null>(null);
  
  // Feedback snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Video element ref for getting duration
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Event listener for show-feedback events
  useEffect(() => {
    const handleShowFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string, severity: 'success' | 'error' }>;
      setSnackbarMessage(customEvent.detail.message);
      setSnackbarSeverity(customEvent.detail.severity);
      setSnackbarOpen(true);
    };
    
    document.addEventListener('show-feedback', handleShowFeedback);
    
    return () => {
      document.removeEventListener('show-feedback', handleShowFeedback);
    };
  }, []);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Load videos on mount and tab change
  useEffect(() => {
    if (tabValue === 0) {
      fetchVideos();
    } else if (tabValue === 1) {
      fetchUsers();
      fetchSiteConfig();
    }
  }, [tabValue]);
  
  // Fetch videos from database
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databases.listDocuments(
        databaseId,
        videoCollectionId
      );
      
      setVideos(response.documents as unknown as Video[]);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch users from database
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databases.listDocuments(
        databaseId,
        userCollectionId
      );
      
      setUsers(response.documents as unknown as User[]);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch site configuration
  const fetchSiteConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databases.listDocuments(
        databaseId,
        siteConfigCollectionId
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0] as unknown as SiteConfig;
        setSiteConfig(config);
        setSiteName(config.site_name);
        setPaypalClientId(config.paypal_client_id);
        setStripePublishableKey(config.stripe_publishable_key || '');
        setStripeSecretKey(config.stripe_secret_key || '');
        setTelegramUsername(config.telegram_username);
        setVideoListTitle(config.video_list_title || 'Available Videos');
        
        // Check if crypto wallets are available in the database
        if (config.crypto && config.crypto.length > 0) {
          setCryptoWallets(config.crypto);
        } else {
          // Try to load from localStorage if not available in the database
          const storedWallets = localStorage.getItem('cryptoWallets');
          if (storedWallets) {
            try {
              const parsedWallets = JSON.parse(storedWallets);
              setCryptoWallets(parsedWallets);
              console.log('Loaded crypto wallets from localStorage:', parsedWallets);
            } catch (err) {
              console.error('Error parsing stored crypto wallets:', err);
              setCryptoWallets([]);
            }
          } else {
            setCryptoWallets([]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching site config:', err);
      setError('Failed to load site configuration');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle video file selection and extract duration
  const handleVideoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setVideoFile(file);
      
      // Create a URL for the video to get its duration
      const videoUrl = URL.createObjectURL(file);
      
      // Create a video element to get duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Get duration in seconds and round to nearest integer
        const duration = Math.round(video.duration);
        setVideoDuration(duration);
        URL.revokeObjectURL(videoUrl);
      };
      
      video.src = videoUrl;
    }
  };
  
  // Handle thumbnail file selection
  const handleThumbnailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnailFile(event.target.files[0]);
    }
  };
  
  // Edit video
  const handleEditVideo = (video: Video) => {
    setVideoTitle(video.title);
    setVideoDescription(video.description);
    setVideoPrice(video.price.toString());
    setProductLink(video.product_link || '');
    setVideoDuration(video.duration || null);
    setEditingVideo(video.$id);
    setShowVideoForm(true);
  };
  
  // Reset video form
  const resetVideoForm = () => {
    setVideoTitle('');
    setVideoDescription('');
    setVideoPrice('');
    setProductLink('');
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoDuration(null);
    setEditingVideo(null);
  };
  
  // Upload video and thumbnail
  const handleVideoUpload = async () => {
    if (!videoTitle || !videoDescription || !videoPrice || !productLink) {
      setError('Please fill all required fields');
      return;
    }
    
    // For new videos, require files
    if (!editingVideo && (!videoFile || !thumbnailFile || !videoDuration)) {
      setError('Please select both video and thumbnail files');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      let videoId = '';
      let thumbnailId = '';
      
      // If editing, only upload new files if provided
      if (editingVideo) {
        // Get current video data
        const existingVideo = await databases.getDocument(
          databaseId,
          videoCollectionId,
          editingVideo
        ) as unknown as Video;
        
        videoId = existingVideo.video_id || '';
        thumbnailId = existingVideo.thumbnail_id || '';
        
        // Upload new thumbnail if provided
        if (thumbnailFile) {
          // Delete old thumbnail if exists
          if (thumbnailId) {
            try {
              await storage.deleteFile(thumbnailsBucketId, thumbnailId);
            } catch (err) {
              console.error('Error deleting old thumbnail:', err);
            }
          }
          
          // Upload new thumbnail
          const thumbnailUpload = await storage.createFile(
            thumbnailsBucketId,
            ID.unique(),
            thumbnailFile
          );
          thumbnailId = thumbnailUpload.$id;
        }
        
        // Upload new video if provided
        if (videoFile) {
          // Delete old video if exists
          if (videoId) {
            try {
              await storage.deleteFile(videosBucketId, videoId);
            } catch (err) {
              console.error('Error deleting old video:', err);
            }
          }
          
          // Upload new video
          const videoUpload = await storage.createFile(
            videosBucketId,
            ID.unique(),
            videoFile
          );
          videoId = videoUpload.$id;
        }
        
        // Update video document
        await databases.updateDocument(
          databaseId,
          videoCollectionId,
          editingVideo,
          {
            title: videoTitle,
            description: videoDescription,
            price: parseFloat(videoPrice),
            product_link: productLink,
            ...(videoId ? { video_id: videoId } : {}),
            ...(thumbnailId ? { thumbnail_id: thumbnailId } : {}),
            ...(videoDuration ? { duration: videoDuration } : {})
          }
        );
        
        // Show success message
        setSnackbarMessage('Video successfully updated!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Upload thumbnail
        const thumbnailUpload = await storage.createFile(
          thumbnailsBucketId,
          ID.unique(),
          thumbnailFile!
        );
        
        // Upload video
        const videoUpload = await storage.createFile(
          videosBucketId,
          ID.unique(),
          videoFile!
        );
        
        // Create video document
        await databases.createDocument(
          databaseId,
          videoCollectionId,
          ID.unique(),
          {
            title: videoTitle,
            description: videoDescription,
            price: parseFloat(videoPrice),
            product_link: productLink,
            video_id: videoUpload.$id,
            thumbnail_id: thumbnailUpload.$id,
            created_at: new Date().toISOString(),
            is_active: true,
            duration: videoDuration
          }
        );
        
        // Show success message
        setSnackbarMessage('Video successfully uploaded!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
      
      // Reset form
      resetVideoForm();
      
      // Hide the form
      setShowVideoForm(false);
      
      // Refresh videos list
      fetchVideos();
      
    } catch (err) {
      console.error('Error uploading video:', err);
      setError('Failed to save video. Please try again.');
      
      // Show error message
      setSnackbarMessage('Failed to save video. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Delete video
  const handleDeleteVideo = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get video document to get file IDs
      const video = await databases.getDocument(
        databaseId,
        videoCollectionId,
        id
      ) as unknown as Video;
      
      // Delete video and thumbnail files if they exist
      if (video.video_id) {
        await storage.deleteFile(videosBucketId, video.video_id);
      }
      
      if (video.thumbnail_id) {
        await storage.deleteFile(thumbnailsBucketId, video.thumbnail_id);
      }
      
      // Delete video document
      await databases.deleteDocument(
        databaseId,
        videoCollectionId,
        id
      );
      
      // Show success message
      setSnackbarMessage('Video successfully deleted!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh videos list
      fetchVideos();
      
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('Failed to delete video. Please try again.');
      
      // Show error message
      setSnackbarMessage('Failed to delete video. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  // Save or update user
  const handleSaveUser = async () => {
    if (!userName || !userEmail || (!editingUser && !userPassword)) {
      setError('Please fill all required user fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const userData = {
        name: userName,
        email: userEmail,
        ...(userPassword ? { password: userPassword } : {})
      };
      
      if (editingUser) {
        // Update existing user
        await databases.updateDocument(
          databaseId,
          userCollectionId,
          editingUser,
          userData
        );
        
        // Show success message
        setSnackbarMessage('User successfully updated!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Create new user
        await databases.createDocument(
          databaseId,
          userCollectionId,
          ID.unique(),
          {
            ...userData,
            created_at: new Date().toISOString()
          }
        );
        
        // Show success message
        setSnackbarMessage('User successfully created!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
      
      // Reset form
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setEditingUser(null);
      setNewUser(false);
      
      // Refresh users list
      fetchUsers();
      
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user. Please try again.');
      
      // Show error message
      setSnackbarMessage('Failed to save user. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete user
  const handleDeleteUser = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Delete user document
      await databases.deleteDocument(
        databaseId,
        userCollectionId,
        id
      );
      
      // Show success message
      setSnackbarMessage('User successfully deleted!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh users list
      fetchUsers();
      
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
      
      // Show error message
      setSnackbarMessage('Failed to delete user. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  // Edit user
  const handleEditUser = (user: User) => {
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword(''); // Don't populate password for security
    setEditingUser(user.$id);
    setNewUser(true);
  };
  
  // Save site configuration
  const handleSaveSiteConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!siteConfig) {
        // Create new config
        const newConfig = {
          site_name: siteName,
          paypal_client_id: paypalClientId,
          stripe_publishable_key: stripePublishableKey,
          stripe_secret_key: stripeSecretKey,
          telegram_username: telegramUsername,
          video_list_title: videoListTitle || 'Available Videos',
          crypto: cryptoWallets,
        };
        
        await databases.createDocument(
          databaseId,
          siteConfigCollectionId,
          ID.unique(),
          newConfig
        );
      } else {
        // Update existing config
        const updatedConfig = {
          site_name: siteName,
          paypal_client_id: paypalClientId,
          stripe_publishable_key: stripePublishableKey,
          stripe_secret_key: stripeSecretKey,
          telegram_username: telegramUsername,
          video_list_title: videoListTitle || 'Available Videos',
          crypto: cryptoWallets,
        };
        
        await databases.updateDocument(
          databaseId,
          siteConfigCollectionId,
          siteConfig.$id,
          updatedConfig
        );
      }
      
      showFeedback('Site configuration saved successfully', 'success');
      refreshConfig(); // Update the context with new config
      setEditingConfig(false);
    } catch (err) {
      console.error('Error saving site config:', err);
      showFeedback('Failed to save site configuration', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (type: 'video' | 'user', id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };
  
  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Add crypto wallet
  const handleAddCryptoWallet = () => {
    if (!newCryptoWallet || !selectedCrypto) return;
    
    // Format: "BTC - Bitcoin: wallet_address"
    const cryptoName = cryptoCurrencies.find(c => c.code === selectedCrypto)?.name || selectedCrypto;
    const walletEntry = `${selectedCrypto} - ${cryptoName}\n${newCryptoWallet}`;
    
    // Check if we already have 5 wallets
    if (cryptoWallets.length >= 5) {
      showFeedback('Maximum of 5 crypto wallets allowed', 'error');
      return;
    }
    
    // Check if this currency already exists
    const existingWallet = cryptoWallets.find(wallet => wallet.startsWith(selectedCrypto));
    if (existingWallet) {
      showFeedback(`A wallet for ${selectedCrypto} already exists`, 'error');
      return;
    }
    
    setCryptoWallets([...cryptoWallets, walletEntry]);
    setNewCryptoWallet('');
  };
  
  // Crypto wallet variables
  const walletsFromDb = siteConfig?.crypto && Array.isArray(siteConfig.crypto) ? siteConfig.crypto : [];
  const walletsToShow = walletsFromDb.length > 0 ? walletsFromDb : cryptoWallets;
  const hasWallets = walletsToShow.length > 0;
  
  // Remove crypto wallet
  const handleRemoveCryptoWallet = (index: number) => {
    // Se estamos exibindo carteiras do banco de dados, atualize as carteiras do banco de dados
    if (walletsFromDb.length > 0) {
      const updatedWallets = [...walletsFromDb];
      updatedWallets.splice(index, 1);
      setCryptoWallets(updatedWallets);
      
      // Se não estamos no modo de edição, salve imediatamente
      if (!editingConfig) {
        // Salvar no banco de dados
        if (siteConfig) {
          databases.updateDocument(
            databaseId,
            siteConfigCollectionId,
            siteConfig.$id,
            { crypto: updatedWallets }
          )
          .then(() => {
            showFeedback('Crypto wallet removed successfully', 'success');
            refreshConfig(); // Atualizar o contexto
            fetchSiteConfig(); // Recarregar as configurações
          })
          .catch((err) => {
            console.error('Error removing crypto wallet:', err);
            showFeedback('Failed to remove crypto wallet', 'error');
          });
        }
      }
    } else {
      // Se estamos exibindo carteiras locais, atualize apenas o estado local
      const updatedWallets = [...cryptoWallets];
      updatedWallets.splice(index, 1);
      setCryptoWallets(updatedWallets);
      
      // Atualizar localStorage
      localStorage.setItem('cryptoWallets', JSON.stringify(updatedWallets));
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab icon={<VideoLibraryIcon />} label="Manage Videos" />
            <Tab icon={<SettingsIcon />} label="Site Configuration & Users" />
          </Tabs>
        </Box>
        
        {/* Videos Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
              <Grid item>
                <Typography variant="h5" component="h2" gutterBottom>
                  Manage Videos
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={editingVideo ? <CancelIcon /> : showVideoForm ? <AddIcon /> : <AddIcon />}
                  onClick={() => {
                    if (editingVideo) {
                      resetVideoForm();
                      setShowVideoForm(false);
                    } else {
                      setShowVideoForm(!showVideoForm);
                    }
                  }}
                >
                  {editingVideo ? 'Cancel Edit' : showVideoForm ? 'Hide Form' : 'Upload New Video'}
                </Button>
              </Grid>
            </Grid>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Collapse in={showVideoForm}>
              <Card sx={{ mt: 2, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {editingVideo ? 'Edit Video' : 'Upload New Video'}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box component="form">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Title"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Price"
                          type="number"
                          value={videoPrice}
                          onChange={(e) => setVideoPrice(e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          multiline
                          rows={3}
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Product Link"
                          placeholder="https://example.com/product"
                          value={productLink}
                          onChange={(e) => setProductLink(e.target.value)}
                          required
                          helperText="Link to the product or payment page"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                        >
                          {editingVideo ? 'Replace Video' : 'Upload Video'}
                          <VisuallyHiddenInput 
                            type="file" 
                            accept="video/*" 
                            onChange={handleVideoFileChange}
                          />
                        </Button>
                        {videoFile && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Video: {videoFile.name} {videoDuration ? `(Duration: ${formatDuration(videoDuration)})` : ''}
                          </Typography>
                        )}
                        {editingVideo && !videoFile && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Leave empty to keep the current video
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                        >
                          {editingVideo ? 'Replace Thumbnail' : 'Upload Thumbnail'}
                          <VisuallyHiddenInput 
                            type="file" 
                            accept="image/*" 
                            onChange={handleThumbnailFileChange}
                          />
                        </Button>
                        {thumbnailFile && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Thumbnail: {thumbnailFile.name}
                          </Typography>
                        )}
                        {editingVideo && !thumbnailFile && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Leave empty to keep the current thumbnail
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleVideoUpload}
                          disabled={
                            (!editingVideo && (!videoFile || !thumbnailFile || !videoTitle || !videoDescription || !videoPrice || !videoDuration || !productLink)) ||
                            (editingVideo && (!videoTitle || !videoDescription || !videoPrice || !productLink)) ||
                            uploading
                          }
                          startIcon={uploading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                        >
                          {uploading ? 'Saving...' : editingVideo ? 'Update Video' : 'Upload Video'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Collapse>
          </Box>
          
          {loading && !error ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.$id}>
                      <TableCell>{video.title}</TableCell>
                      <TableCell>${video.price}</TableCell>
                      <TableCell>{formatDuration(video.duration)}</TableCell>
                      <TableCell>{video.is_active ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleEditVideo(video)}
                          aria-label="edit video"
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => openDeleteDialog('video', video.$id)}
                          aria-label="delete video"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {videos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No videos found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        {/* Site Configuration & Users Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={4}>
            {/* Site Configuration Section */}
            <Grid item xs={12} lg={6}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                      <Grid item>
                        <Typography variant="h5" component="h2" gutterBottom>
                          Site Configuration
                        </Typography>
                      </Grid>
                      {!editingConfig && (
                        <Grid item>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setEditingConfig(true)}
                            startIcon={<EditIcon />}
                            size="small"
                          >
                            Edit
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                  
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                  
                  {loading && !editingConfig ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box>
                      {editingConfig ? (
                        <Box component="form">
                          <TextField
                            fullWidth
                            margin="normal"
                            label="Site Name"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            required
                          />
                          
                          <TextField
                            fullWidth
                            margin="normal"
                            label="Video List Title"
                            value={videoListTitle}
                            onChange={(e) => setVideoListTitle(e.target.value)}
                            helperText="Title shown on the video listing page"
                          />
                          
                          <TextField
                            fullWidth
                            margin="normal"
                            label="PayPal Client ID"
                            value={paypalClientId}
                            onChange={(e) => setPaypalClientId(e.target.value)}
                          />
                          
                          <TextField
                            fullWidth
                            label="Stripe Publishable Key"
                            value={stripePublishableKey}
                            onChange={(e) => setStripePublishableKey(e.target.value)}
                            margin="normal"
                            disabled={!editingConfig}
                          />
                          
                          <TextField
                            fullWidth
                            label="Stripe Secret Key"
                            value={stripeSecretKey}
                            onChange={(e) => setStripeSecretKey(e.target.value)}
                            margin="normal"
                            disabled={!editingConfig}
                            type="password"
                          />
                          
                          <TextField
                            fullWidth
                            margin="normal"
                            label="Telegram Username (without @)"
                            value={telegramUsername}
                            onChange={(e) => setTelegramUsername(e.target.value)}
                          />
                          
                          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                            Crypto Wallets
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Add up to 5 cryptocurrency wallets for payment
                            </Typography>
                            <Alert severity="info" sx={{ mt: 1, mb: 1 }} variant="outlined">
                              <Typography variant="caption">
                                Note: If you're seeing errors about the "crypto" attribute, please make sure it's correctly 
                                configured in your Appwrite database. Your wallets will be saved locally in the meantime.
                              </Typography>
                            </Alert>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            {cryptoWallets.map((wallet, index) => {
                              const [header, address] = wallet.split('\n');
                              return (
                                <Paper key={index} variant="outlined" sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="subtitle2">{header}</Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{address}</Typography>
                                  </Box>
                                  <IconButton 
                                    color="error" 
                                    onClick={() => {
                                      // Se as carteiras estão vindo do banco de dados, precisamos atualizar o estado local primeiro
                                      if (walletsFromDb.length > 0) {
                                        const updatedWallets = [...walletsFromDb];
                                        updatedWallets.splice(index, 1);
                                        setCryptoWallets(updatedWallets);
                                        
                                        // Salvar imediatamente no banco de dados
                                        handleSaveSiteConfig();
                                      } else {
                                        // Se são carteiras locais, apenas remover do estado
                                        handleRemoveCryptoWallet(index);
                                      }
                                    }}
                                    size="small"
                                    aria-label="remove wallet"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Paper>
                              );
                            })}
                            
                            {cryptoWallets.length === 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                No crypto wallets added yet
                              </Typography>
                            )}
                          </Box>
                          
                          {cryptoWallets.length < 5 && (
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                  <InputLabel id="crypto-select-label">Cryptocurrency</InputLabel>
                                  <Select
                                    labelId="crypto-select-label"
                                    value={selectedCrypto}
                                    label="Cryptocurrency"
                                    onChange={(e) => setSelectedCrypto(e.target.value)}
                                  >
                                    {cryptoCurrencies.map((crypto) => (
                                      <MenuItem key={crypto.code} value={crypto.code}>
                                        {crypto.code} - {crypto.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Wallet Address"
                                  value={newCryptoWallet}
                                  onChange={(e) => setNewCryptoWallet(e.target.value)}
                                  placeholder="Enter wallet address"
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={handleAddCryptoWallet}
                                  fullWidth
                                >
                                  Add
                                </Button>
                              </Grid>
                            </Grid>
                          )}
                          
                          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleSaveSiteConfig}
                              disabled={loading}
                              startIcon={<SaveIcon />}
                            >
                              Save
                            </Button>
                            
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setEditingConfig(false);
                                if (siteConfig) {
                                  setSiteName(siteConfig.site_name);
                                  setPaypalClientId(siteConfig.paypal_client_id);
                                  setStripePublishableKey(siteConfig.stripe_publishable_key || '');
                                  setStripeSecretKey(siteConfig.stripe_secret_key || '');
                                  setTelegramUsername(siteConfig.telegram_username);
                                  setVideoListTitle(siteConfig.video_list_title || 'Available Videos');
                                }
                              }}
                              startIcon={<CancelIcon />}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              <strong>Site Name:</strong> {siteConfig?.site_name || 'Not set'}
                            </Typography>
                            
                            <Typography variant="subtitle1" gutterBottom>
                              <strong>PayPal Client ID:</strong> {siteConfig?.paypal_client_id || 'Not set'}
                            </Typography>
                            
                            <Typography variant="subtitle1">
                              <strong>Stripe Publishable Key:</strong> {siteConfig?.stripe_publishable_key || 'Not set'}
                            </Typography>
                            
                            <Typography variant="subtitle1">
                              <strong>Stripe Secret Key:</strong> {siteConfig?.stripe_secret_key ? '•••••••••••••••••••••' : 'Not set'}
                            </Typography>
                            
                            <Typography variant="subtitle1">
                              <strong>Telegram Username:</strong> {siteConfig?.telegram_username ? `@${siteConfig.telegram_username}` : 'Not set'}
                            </Typography>
                            
                            <Typography variant="subtitle1" gutterBottom>
                              <strong>Video List Title:</strong> {siteConfig?.video_list_title || 'Not set'}
                            </Typography>
                            
                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                              <strong>Crypto Wallets:</strong>
                            </Typography>
                            
                            {hasWallets ? (
                              <Box sx={{ mt: 1 }}>
                                {walletsToShow.map((wallet, index) => {
                                  const [header, address] = wallet.split('\n');
                                  return (
                                    <Paper key={index} variant="outlined" sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Box>
                                        <Typography variant="subtitle2">{header}</Typography>
                                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{address}</Typography>
                                      </Box>
                                      <IconButton 
                                        color="error" 
                                        onClick={() => handleRemoveCryptoWallet(index)}
                                        size="small"
                                        aria-label="remove wallet"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Paper>
                                  );
                                })}
                                {walletsFromDb.length === 0 && cryptoWallets.length > 0 && (
                                  <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                                    <Typography variant="caption">
                                      These wallets are currently stored in your browser only.
                                    </Typography>
                                  </Alert>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No crypto wallets configured
                              </Typography>
                            )}
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Users Management Section */}
            <Grid item xs={12} lg={6}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                      <Grid item>
                        <Typography variant="h5" component="h2" gutterBottom>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupIcon sx={{ mr: 1 }} /> Manage Users
                          </Box>
                        </Typography>
                      </Grid>
                      {!newUser && (
                        <Grid item>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setNewUser(true)}
                            startIcon={<AddIcon />}
                            size="small"
                          >
                            Add User
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                  
                  <Collapse in={newUser}>
                    <Paper sx={{ p: 2, mb: 3 }} elevation={0} variant="outlined">
                      <Typography variant="h6" gutterBottom>
                        {editingUser ? 'Edit User' : 'New User'}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box component="form">
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Name"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Email"
                              type="email"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Password"
                              type="password"
                              value={userPassword}
                              onChange={(e) => setUserPassword(e.target.value)}
                              required={!editingUser}
                              helperText={editingUser ? "Leave blank to keep current password" : ""}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSaveUser}
                                disabled={loading}
                                startIcon={<SaveIcon />}
                              >
                                {editingUser ? 'Update' : 'Create'}
                              </Button>
                              
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setNewUser(false);
                                  setEditingUser(null);
                                  setUserName('');
                                  setUserEmail('');
                                  setUserPassword('');
                                }}
                                startIcon={<CancelIcon />}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  </Collapse>
                  
                  {loading && !newUser && !editingUser ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.$id}>
                              <TableCell>{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <IconButton 
                                  color="primary" 
                                  onClick={() => handleEditUser(user)}
                                  aria-label="edit user"
                                  size="small"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  color="error" 
                                  onClick={() => openDeleteDialog('user', user.$id)}
                                  aria-label="delete user"
                                  size="small"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          {users.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                No users found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (itemToDelete) {
                if (itemToDelete.type === 'video') {
                  handleDeleteVideo(itemToDelete.id);
                } else {
                  handleDeleteUser(itemToDelete.id);
                }
              }
            }} 
            color="error" 
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <CustomAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </CustomAlert>
      </Snackbar>
    </Container>
  );
};

export default Admin;

// Helper function to show feedback via snackbar
function showFeedback(message: string, severity: 'success' | 'error') {
  // Access snackbar state from component scope
  // This is a workaround since the function is defined outside the component
  const event = new CustomEvent('show-feedback', {
    detail: { message, severity }
  });
  document.dispatchEvent(event);
}

