import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Compare as CompareIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import PropertyGrid from './PropertyGrid';
import PropertyCard from './PropertyCard';
import SearchFilter from './ui/SearchFilter';
import api from '../services/api';
import { usePendingReview } from '../hooks/usePendingReview';
import { useSearch } from '../contexts/SearchContext';
import BackButton from './ui/BackButton';

function PendingReview() {
  const navigate = useNavigate();
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showRegular, setShowRegular] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [compareDialog, setCompareDialog] = useState({ open: false, duplicate: null, original: null });
  const { fetchPendingReview } = usePendingReview();
  const { filterProperties, updateDynamicFields } = useSearch();

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  useEffect(() => {
    // Update dynamic fields after pendingProperties changes (safe post-render)
    if (pendingProperties && pendingProperties.length > 0) {
      updateDynamicFields(pendingProperties);
    }
  }, [pendingProperties, updateDynamicFields]);

  const fetchPendingProperties = async () => {
    try {
      const properties = await api.getPendingReviewProperties();
      setPendingProperties(properties);
    } catch (error) {
      console.error('Error fetching pending properties:', error);
      setMessage('Error loading pending review properties');
    } finally {
      setLoading(false);
    }
  };

  const getVisiblePending = () => {
    const filtered = filterProperties(pendingProperties);
    return filtered.filter((p) => {
      const isRegular = !p.archived && !p.deleted;
      if (!showRegular && isRegular) return false;
      if (!showArchived && p.archived) return false;
      if (!showDeleted && p.deleted) return false;
      return true;
    });
  };

  const handleApprove = async (duplicateId, originalId) => {
    try {
      // Promote duplicate by default per requirement (Approve & Replace)
      await api.approveDuplicate(duplicateId, originalId, 'duplicate');
      setMessage('Property approved successfully!');
      fetchPendingProperties(); // Refresh the list
      fetchPendingReview(); // Refresh the count in header
    } catch (error) {
      setMessage('Error approving property: ' + error.message);
    }
  };

  const handleReject = async (duplicateId) => {
    if (window.confirm('Are you sure you want to reject this duplicate property?')) {
      try {
        await api.rejectDuplicate(duplicateId);
        setMessage('Property rejected successfully!');
        fetchPendingProperties(); // Refresh the list
        fetchPendingReview(); // Refresh the count in header
      } catch (error) {
        setMessage('Error rejecting property: ' + error.message);
      }
    }
  };

  const handleCompare = async (duplicate) => {
    try {
      let original;
      try {
        original = await api.getOriginalProperty(duplicate.id);
      } catch (e) {
        // If the duplicate doesn't link to original, try the inverse:
        // If this card is actually the original demoted to pending and links to the promoted item, fetch that instead
        if (duplicate.duplicate_of) {
          original = await api.getProperty(duplicate.duplicate_of?._id || duplicate.duplicate_of);
        } else {
          throw e;
        }
      }
      setCompareDialog({ open: true, duplicate, original });
    } catch (error) {
      setMessage('Error loading original property: ' + error.message);
    }
  };

  const closeCompareDialog = () => {
    setCompareDialog({ open: false, duplicate: null, original: null });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading pending review properties...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <BackButton />
      <Typography variant="h4" gutterBottom>
        Pending Review Properties
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
        These properties were detected as potential duplicates and require your review.
      </Typography>

      {/* Spacer before alerts */}
      <Box sx={{ mb: 1 }} />

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* Search Filter */}
      <SearchFilter properties={pendingProperties} showAdvanced={true} />

      {/* Toggle Row - consistent with Follow-Ups (placed under SearchFilter) */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <FormControlLabel
          control={<Switch size="small" checked={showRegular} onChange={(e) => setShowRegular(e.target.checked)} />}
          label="Show Regular"
        />
        <FormControlLabel
          control={<Switch size="small" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />}
          label="Show Archived"
        />
        <FormControlLabel
          control={<Switch size="small" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
          label="Show Deleted"
        />
      </Box>

      {/* Results count */}
      <Box mb={2}>
        <Typography variant="body2" color="textSecondary">
          {getVisiblePending().length} {getVisiblePending().length === 1 ? 'property' : 'properties'} found
        </Typography>
      </Box>

      <PropertyGrid 
        properties={getVisiblePending()}
        loading={loading}
        emptyMessage="No properties pending review"
        showFollowUpBadge={true}
        onFollowUpSet={(propertyId, days) => {
          // Follow-up set - refresh the list
          fetchPendingProperties();
        }}
        onFollowUpRemoved={(propertyId) => {
          // Follow-up removed - refresh the list
          fetchPendingProperties();
        }}
        onPropertyUpdate={(updatedProperty) => {
          // Property update - refresh the list
          fetchPendingProperties();
        }}
        onUpdate={() => {
          // Refresh the list
          fetchPendingProperties();
        }}
        customActions={(property) => (
          <Box display="flex" gap={1} flexWrap="wrap" width="100%">
            <Button
              size="small"
              variant="outlined"
              startIcon={<CompareIcon />}
              onClick={() => handleCompare(property)}
              sx={{ flex: 1, minWidth: 'fit-content' }}
            >
              Compare
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => handleApprove(property.id, property.duplicate_of?._id || property.duplicate_of)}
              sx={{ flex: 1, minWidth: 'fit-content' }}
              disabled={!property.duplicate_of}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => handleReject(property.id)}
              sx={{ flex: 1, minWidth: 'fit-content' }}
            >
              Reject
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/properties/${property.id}?edit=1`)}
              sx={{ flex: 1, minWidth: 'fit-content' }}
            >
              Edit
            </Button>
          </Box>
        )}
      />

      {/* Compare Dialog */}
      <Dialog 
        open={compareDialog.open} 
        onClose={closeCompareDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Compare Properties</DialogTitle>
        <DialogContent>
          {compareDialog.duplicate && compareDialog.original && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Duplicate Property
                </Typography>
                <PropertyComparisonCard property={compareDialog.duplicate} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Original Property
                </Typography>
                <PropertyComparisonCard property={compareDialog.original} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCompareDialog}>Close</Button>
          {compareDialog.duplicate && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleApprove(compareDialog.duplicate.id, compareDialog.duplicate.duplicate_of?._id || compareDialog.duplicate.duplicate_of);
                closeCompareDialog();
              }}
            >
              Approve & Replace
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Helper component for property comparison
function PropertyComparisonCard({ property }) {
  return (
    <PropertyCard 
      property={property}
      variant="outlined"
      showActions={false}
      compact={true}
    />
  );
}

export default PendingReview; 