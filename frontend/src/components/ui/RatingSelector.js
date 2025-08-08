import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Rating as MuiRating
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { RATING_CONFIG } from '../../constants';
import { getRatingLabel } from '../../utils';

function RatingSelector({ open, onClose, onRatingSelect, currentRating = 0 }) {
  const [rating, setRating] = useState(currentRating);

  const handleRatingChange = (event, newValue) => {
    setRating(newValue);
  };

  const handleConfirm = () => {
    onRatingSelect(rating);
    onClose();
  };

  const handleCancel = () => {
    setRating(currentRating);
    onClose();
  };

  const handleRemoveRating = () => {
    onRatingSelect(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Rate this Property
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <Typography variant="body1" gutterBottom>
            How would you rate this property?
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2 }}>
            <MuiRating
              value={rating}
              onChange={handleRatingChange}
              max={RATING_CONFIG.MAX}
              size="large"
              icon={<StarIcon sx={{ fontSize: 28 }} />}
              emptyIcon={<StarBorderIcon sx={{ fontSize: 28 }} />}
            />
            <Typography variant="h6" sx={{ ml: 1 }}>
              {rating}/{RATING_CONFIG.MAX}
            </Typography>
          </Box>
          
          {rating > 0 && (
            <Typography variant="body2" color="textSecondary">
              {getRatingLabel(rating)}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {currentRating > 0 && (
          <Button onClick={handleRemoveRating} color="error">
            Remove Rating
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={rating === 0}
        >
          Confirm Rating
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RatingSelector; 