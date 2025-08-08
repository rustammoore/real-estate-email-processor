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
  Grid,
  TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../services/api';

const FollowUpActions = ({ property, onUpdate, onFollowUpSet, onFollowUpRemoved }) => {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const handleClose = () => {
    setShowDialog(false);
    setShowCustomDate(false);
    setCustomDate('');
  };

  const handleSetFollowUp = async (days) => {
    try {
      setLoading(true);
      await api.setFollowUp(property.id, days);
      if (onFollowUpSet) {
        onFollowUpSet(property.id, days);
      }
      if (onUpdate) {
        onUpdate();
      }
      setShowDialog(false);
    } catch (error) {
      console.error('Error setting follow-up:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCustomFollowUp = async () => {
    if (!customDate) return;
    
    try {
      setLoading(true);
      const targetDate = new Date(customDate);
      const now = new Date();
      const diffTime = targetDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      await api.setFollowUp(property.id, diffDays);
      if (onFollowUpSet) {
        onFollowUpSet(property.id, diffDays);
      }
      if (onUpdate) {
        onUpdate();
      }
      setShowDialog(false);
      setShowCustomDate(false);
      setCustomDate('');
    } catch (error) {
      console.error('Error setting custom follow-up:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFollowedUp = async () => {
    try {
      setLoading(true);
      await api.markAsFollowedUp(property.id);
      if (onUpdate) {
        onUpdate();
      }
      setShowDialog(false);
    } catch (error) {
      console.error('Error marking as followed up:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFollowUp = async () => {
    try {
      setLoading(true);
      await api.removeFollowUp(property.id);
      if (onFollowUpRemoved) {
        onFollowUpRemoved(property.id);
      }
      if (onUpdate) {
        onUpdate();
      }
      setShowDialog(false);
    } catch (error) {
      console.error('Error removing follow-up:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDialog = () => {
    setShowDialog(!showDialog);
    setShowCustomDate(false);
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleToggleDialog}
        disabled={loading}
        title={property.followUpDate ? 'Manage follow-up' : 'Set follow-up'}
        sx={{
          border: '1px solid #ddd',
          backgroundColor: property.followUpDate ? '#e3f2fd' : 'white',
          borderColor: property.followUpDate ? '#2196f3' : '#ddd',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#2196f3'
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          {property.followUpDate && (
            <circle cx="12" cy="16" r="2" fill="currentColor"/>
          )}
        </svg>
      </IconButton>

      <Dialog open={showDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Set Follow-up</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => handleSetFollowUp(30)}
                disabled={loading}
                sx={{ 
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="h6">30</Typography>
                <Typography variant="caption">days</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => handleSetFollowUp(60)}
                disabled={loading}
                sx={{ 
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="h6">60</Typography>
                <Typography variant="caption">days</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => handleSetFollowUp(90)}
                disabled={loading}
                sx={{ 
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="h6">90</Typography>
                <Typography variant="caption">days</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => handleSetFollowUp(180)}
                disabled={loading}
                sx={{ 
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="h6">6</Typography>
                <Typography variant="caption">months</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => handleSetFollowUp(365)}
                disabled={loading}
                sx={{ 
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="h6">12</Typography>
                <Typography variant="caption">months</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => setShowCustomDate(!showCustomDate)}
                disabled={loading}
                sx={{ 
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="h6">📅</Typography>
                <Typography variant="caption">Custom</Typography>
              </Button>
            </Grid>
          </Grid>

          {showCustomDate && (
            <Box mt={2}>
              <TextField
                type="date"
                fullWidth
                label="Custom Follow-up Date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleSetCustomFollowUp}
                disabled={!customDate || loading}
                sx={{ mt: 1 }}
              >
                Set Custom Date
              </Button>
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleRemoveFollowUp} color="error" disabled={loading}>
            Remove Follow-up
          </Button>
          <Button onClick={handleMarkAsFollowedUp} color="success" disabled={loading}>
            Followed Up
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FollowUpActions;