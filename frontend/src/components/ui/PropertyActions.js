import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Badge,
  Rating
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArchiveIcon from '@mui/icons-material/Archive';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import RatingSelector from './RatingSelector';
import { INTERACTION_CONFIG, RATING_CONFIG } from '../../constants';
import { getRatingColor } from '../../utils';
import { usePropertyInteractions } from '../../hooks';

function PropertyActions({ property, onUpdate }) {
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const { loading, handleLike, handleLove, handleRating, handleArchive } = usePropertyInteractions(property, onUpdate);

  const handleRatingSelect = async (rating) => {
    await handleRating(rating);
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
        {/* Like Button */}
        <Tooltip title={property.liked ? INTERACTION_CONFIG.like.tooltip.active : INTERACTION_CONFIG.like.tooltip.inactive}>
          <IconButton
            size="small"
            onClick={handleLike}
            disabled={loading}
            sx={{
              color: property.liked ? `${INTERACTION_CONFIG.like.color}.main` : 'grey.500',
              '&:hover': {
                color: property.liked ? `${INTERACTION_CONFIG.like.color}.dark` : `${INTERACTION_CONFIG.like.color}.main`
              }
            }}
          >
            {property.liked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Love Button */}
        <Tooltip title={property.loved ? INTERACTION_CONFIG.love.tooltip.active : INTERACTION_CONFIG.love.tooltip.inactive}>
          <IconButton
            size="small"
            onClick={handleLove}
            disabled={loading}
            sx={{
              color: property.loved ? `${INTERACTION_CONFIG.love.color}.main` : 'grey.500',
              '&:hover': {
                color: property.loved ? `${INTERACTION_CONFIG.love.color}.dark` : `${INTERACTION_CONFIG.love.color}.main`
              }
            }}
          >
            {property.loved ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Rating Button */}
        <Tooltip title={property.rating > 0 ? `Rating: ${property.rating}/${RATING_CONFIG.MAX}` : INTERACTION_CONFIG.rating.tooltip.inactive}>
          <IconButton
            size="small"
            onClick={() => setRatingDialogOpen(true)}
            disabled={loading}
            sx={{
              color: property.rating > 0 ? getRatingColor(property.rating) : 'grey.500',
              '&:hover': {
                color: property.rating > 0 ? getRatingColor(property.rating) : `${INTERACTION_CONFIG.rating.color}.main`
              }
            }}
          >
            <Badge badgeContent={property.rating > 0 ? property.rating : 0} color="primary">
              {property.rating > 0 ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Archive Button */}
        <Tooltip title={property.archived ? INTERACTION_CONFIG.archive.tooltip.active : INTERACTION_CONFIG.archive.tooltip.inactive}>
          <IconButton
            size="small"
            onClick={handleArchive}
            disabled={loading}
            sx={{
              color: property.archived ? `${INTERACTION_CONFIG.archive.color}.main` : 'grey.500',
              '&:hover': {
                color: property.archived ? `${INTERACTION_CONFIG.archive.color}.dark` : `${INTERACTION_CONFIG.archive.color}.main`
              }
            }}
          >
            {property.archived ? <ArchiveIcon fontSize="small" /> : <ArchiveOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Rating Dialog */}
      <RatingSelector
        open={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        onRatingSelect={handleRatingSelect}
        currentRating={property.rating || 0}
      />
    </>
  );
}

export default PropertyActions; 