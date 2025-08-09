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
  TextField,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../services/api';

const FollowUpActions = ({ property, onUpdate, onFollowUpSet, onFollowUpRemoved }) => {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [daysInput, setDaysInput] = useState('');

  const handleClose = () => {
    setShowDialog(false);
    setShowCustomDate(false);
    setCustomDate('');
  };

  const handleSetFollowUp = async (days) => {
    try {
      setLoading(true);
      const updated = await api.setFollowUp(property.id, days);
      if (onFollowUpSet) {
        onFollowUpSet(property.id, days);
      }
      try {
        window.dispatchEvent(new CustomEvent('property:updated', { detail: updated }));
      } catch (_) {}
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
      // Persist exact date, including past dates
      const updated = await api.setFollowUpDate(property.id, customDate);
      if (onFollowUpSet) {
        // For UI that expects days, we can pass 0 or compute if needed; refresh callbacks will refetch
        onFollowUpSet(property.id, 0);
      }
      try {
        window.dispatchEvent(new CustomEvent('property:updated', { detail: updated }));
      } catch (_) {}
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

  const handleSetDaysFollowUp = async () => {
    const days = parseInt(daysInput, 10);
    if (isNaN(days)) return;
    try {
      setLoading(true);
      const updated = await api.setFollowUp(property.id, days);
      if (onFollowUpSet) {
        onFollowUpSet(property.id, days);
      }
      try {
        window.dispatchEvent(new CustomEvent('property:updated', { detail: updated }));
      } catch (_) {}
      if (onUpdate) {
        onUpdate();
      }
      setShowDialog(false);
      setDaysInput('');
    } catch (error) {
      console.error('Error setting follow-up days:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFollowedUp = async () => {
    try {
      setLoading(true);
      const updated = await api.markAsFollowedUp(property.id);
      try {
        window.dispatchEvent(new CustomEvent('property:updated', { detail: updated }));
      } catch (_) {}
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
      const updated = await api.removeFollowUp(property.id);
      if (onFollowUpRemoved) {
        onFollowUpRemoved(property.id);
      }
      try {
        window.dispatchEvent(new CustomEvent('property:updated', { detail: updated }));
      } catch (_) {}
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

      <Dialog open={showDialog} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ py: 1.25, px: 1.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Set Follow-up</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 1.5 }}>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => handleSetFollowUp(30)}
                disabled={loading}
                sx={{ 
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="body2">30</Typography>
                <Typography variant="caption">days</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => handleSetFollowUp(60)}
                disabled={loading}
                sx={{ 
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="body2">60</Typography>
                <Typography variant="caption">days</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => handleSetFollowUp(90)}
                disabled={loading}
                sx={{ 
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="body2">90</Typography>
                <Typography variant="caption">days</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => handleSetFollowUp(180)}
                disabled={loading}
                sx={{ 
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="body2">6</Typography>
                <Typography variant="caption">months</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => handleSetFollowUp(365)}
                disabled={loading}
                sx={{ 
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="body2">12</Typography>
                <Typography variant="caption">months</Typography>
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => setShowCustomDate(!showCustomDate)}
                disabled={loading}
                sx={{ 
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Typography variant="body2">📅</Typography>
                <Typography variant="caption">Custom</Typography>
              </Button>
            </Grid>
          </Grid>

          {/* Quick numeric days input */}
          <Box mt={1.5} display="flex" gap={1} alignItems="center">
            <TextField
              type="number"
              size="small"
              label="Days from now"
              value={daysInput}
              onChange={(e) => setDaysInput(e.target.value)}
              inputProps={{ inputMode: 'numeric', min: -3650, max: 3650, step: 1 }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSetDaysFollowUp}
              disabled={loading || daysInput === '' || isNaN(parseInt(daysInput, 10))}
            >
              Set
            </Button>
          </Box>

          {showCustomDate && (
            <Box mt={1.5}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Custom Follow-up Date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
                helperText="You can pick from calendar or type YYYY-MM-DD"
              />
              <Button
                variant="contained"
                fullWidth
                size="small"
                onClick={handleSetCustomFollowUp}
                disabled={!customDate || loading}
                sx={{ mt: 1 }}
              >
                Set Custom Date
              </Button>
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ px: 1.5, py: 1 }}>
          <Button onClick={handleRemoveFollowUp} color="error" size="small" disabled={loading}>
            Remove Follow-up
          </Button>
          <Button onClick={handleMarkAsFollowedUp} color="success" size="small" disabled={loading}>
            Followed Up
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose} size="small">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FollowUpActions;