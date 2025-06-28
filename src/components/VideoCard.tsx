import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Skeleton from '@mui/material/Skeleton';
import { VideoService } from '../services/VideoService';

interface VideoCardProps {
  video: {
    $id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl?: string;
    isPurchased?: boolean;
    duration?: string | number;
    views?: number;
    createdAt?: string;
  };
}

const VideoCard: FC<VideoCardProps> = ({ video }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleCardClick = async () => {
    try {
      // Increment view count
      await VideoService.incrementViews(video.$id);
      
      // Navigate to video page
      navigate(`/video/${video.$id}`);
    } catch (error) {
      console.error('Error handling video card click:', error);
      // Navigate anyway even if incrementing views fails
      navigate(`/video/${video.$id}`);
    }
  };

  // Format the duration nicely
  const formatDuration = (duration?: string | number) => {
    if (duration === undefined || duration === null) return '00:00';
    
    // If duration is a number (seconds), convert to string format
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}min ${seconds}s`;
    }
    
    // If duration is already a string, check format
    if (typeof duration === 'string') {
      try {
        // Check if duration is in format MM:SS or HH:MM:SS
        const parts = duration.split(':');
        if (parts.length === 2) {
          return `${parts[0]}min ${parts[1]}s`;
        } else if (parts.length === 3) {
          return `${parts[0]}h ${parts[1]}m ${parts[2]}s`;
        }
      } catch (error) {
        console.error('Error formatting duration:', error);
        // Return the original string if split fails
        return duration;
      }
    }
    
    // Return as is if we can't parse it
    return String(duration);
  };

  // Format view count with K, M, etc.
  const formatViews = (views?: number) => {
    if (views === undefined) return '0 views';
    if (views < 1000) return `${views} views`;
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K views`;
    return `${(views / 1000000).toFixed(1)}M views`;
  };

  // Format date to relative time
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        }
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ position: 'relative', paddingTop: '56.25%' /* 16:9 aspect ratio */ }}>
        {video.thumbnailUrl ? (
          <CardMedia
            component="img"
            image={video.thumbnailUrl}
            alt={video.title}
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#f0f0f0',
            }}
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/300x180?text=Video+Thumbnail';
            }}
          />
        ) : (
          <Skeleton 
            variant="rectangular" 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
            }} 
            animation="wave" 
          />
        )}
        
        {/* Hover overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <Box
            sx={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
        </Box>
        
        {/* Duration badge */}
        {video.duration && (
          <Chip 
            label={formatDuration(video.duration)} 
            size="small" 
            sx={{ 
              position: 'absolute', 
              bottom: 8, 
              right: 8, 
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontWeight: 'bold',
              height: '24px',
              '& .MuiChip-label': {
                px: 1,
              }
            }}
            icon={<AccessTimeIcon sx={{ color: 'white', fontSize: '14px' }} />}
          />
        )}
        
        {/* Price badge */}
        <Chip 
          label={`$${video.price.toFixed(2)}`} 
          color="primary" 
          size="small" 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, p: 2, pt: 1.5 }}>
        <Typography gutterBottom variant="h6" component="div" sx={{
          fontWeight: 'bold',
          fontSize: '1rem',
          lineHeight: 1.2,
          mb: 1,
          height: '2.4rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {video.title}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <VisibilityIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              {formatViews(video.views)}
            </Typography>
          </Box>
          
          {video.createdAt && (
            <Typography variant="caption" color="text.secondary">
              {formatDate(video.createdAt)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default VideoCard; 