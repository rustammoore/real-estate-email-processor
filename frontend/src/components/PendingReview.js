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
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        These properties were detected as potential duplicates and require your review.
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* Search Filter */}
      <SearchFilter properties={pendingProperties} showAdvanced={true} />

      {/* Results count */}
      <Box mb={2}>
        <Typography variant="body2" color="textSecondary">
          {filterProperties(pendingProperties).length} {filterProperties(pendingProperties).length === 1 ? 'property' : 'properties'} found
        </Typography>
      </Box>

      <PropertyGrid 
        properties={filterProperties(pendingProperties)}
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