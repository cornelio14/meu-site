import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import { VideoService, Video } from '../services/VideoService';

interface FeaturedBannerProps {
  onError?: (error: string) => void;
}

const FeaturedBanner = ({ onError }: FeaturedBannerProps) => {
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se já temos um vídeo em destaque armazenado na sessão
    const storedFeaturedVideo = sessionStorage.getItem('featuredVideo');
    
    if (storedFeaturedVideo) {
      try {
        // Se já temos um vídeo armazenado, usá-lo
        setFeaturedVideo(JSON.parse(storedFeaturedVideo));
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing stored featured video:', error);
        // Se houver erro ao analisar o vídeo armazenado, buscar um novo
      }
    }

    // Se não temos um vídeo armazenado, buscar um novo
    const fetchRandomVideo = async () => {
      try {
        setLoading(true);
        // Buscar todos os vídeos
        const videos = await VideoService.getAllVideos();
        
        if (videos.length > 0) {
          // Selecionar um vídeo aleatório
          const randomIndex = Math.floor(Math.random() * videos.length);
          const selectedVideo = videos[randomIndex];
          
          // Armazenar o vídeo selecionado na sessão para uso futuro
          sessionStorage.setItem('featuredVideo', JSON.stringify(selectedVideo));
          
          setFeaturedVideo(selectedVideo);
        }
      } catch (error) {
        console.error('Error fetching featured video:', error);
        if (onError) {
          onError('Failed to load featured content');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRandomVideo();
  }, [onError]);

  if (loading || !featuredVideo) {
    return null; // Ou um skeleton loader
  }

  // Extrair apenas o que precisamos da descrição (primeiros 150 caracteres)
  const truncatedDescription = featuredVideo.description.length > 150 
    ? `${featuredVideo.description.substring(0, 150)}...` 
    : featuredVideo.description;

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: '70vh', md: '80vh' },
        width: '100%',
        overflow: 'hidden',
        mb: 4,
      }}
    >
      {/* Imagem de fundo (thumbnail) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${featuredVideo.thumbnailUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)',
          },
        }}
      />

      {/* Conteúdo do banner */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: 0,
          width: '100%',
          padding: { xs: '0 5%', md: '0 10%' },
          zIndex: 2,
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            mb: 2,
          }}
        >
          {featuredVideo.title}
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ 
            color: 'white', 
            maxWidth: { xs: '100%', md: '50%' },
            mb: 3,
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {truncatedDescription}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            to={`/video/${featuredVideo.$id}`}
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            sx={{
              bgcolor: 'white',
              color: 'black',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.75)',
              },
              px: 4,
              py: 1,
            }}
          >
            Play
          </Button>
          
          <Button
            component={Link}
            to={`/video/${featuredVideo.$id}`}
            variant="contained"
            size="large"
            startIcon={<InfoIcon />}
            sx={{
              bgcolor: 'rgba(109, 109, 110, 0.7)',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'rgba(109, 109, 110, 0.9)',
              },
              px: 4,
              py: 1,
            }}
          >
            More Info
          </Button>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#46d369', 
              fontWeight: 'bold',
              display: 'inline-block',
              border: '1px solid #46d369',
              px: 1,
              borderRadius: '4px',
            }}
          >
            {featuredVideo.duration}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ color: 'white' }}
          >
            ${featuredVideo.price.toFixed(2)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default FeaturedBanner; 