import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Switch,
  FormControlLabel
} from '@mui/material';
import api from '../services/api';
import { useSearch } from '../contexts/SearchContext';
import PropertyGrid from './PropertyGrid';
import SearchFilter from './ui/SearchFilter';
import ConfirmationDialog from './ui/ConfirmationDialog';
import { useToast } from '../contexts/ToastContext';

function PropertyList() {
  const { updateDynamicFields, filterProperties } = useSearch();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setMessage] = useState('');
  const [showRegular, setShowRegular] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedProperties, setDeletedProperties] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const combined = showDeleted ? [...properties, ...deletedProperties] : properties;
    if (combined && combined.length > 0) {
      updateDynamicFields(combined);
    }
  }, [properties, deletedProperties, showDeleted, updateDynamicFields]);

  // Lazy-load deleted properties when toggle is enabled
  useEffect(() => {
    const fetchDeletedIfNeeded = async () => {
      if (showDeleted && deletedProperties.length === 0 && !loadingDeleted) {
        try {
          setLoadingDeleted(true);
          const data = await api.getDeletedProperties();
          setDeletedProperties(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching deleted properties:', error);
        } finally {
          setLoadingDeleted(false);
        }
      }
    };
    fetchDeletedIfNeeded();
  }, [showDeleted, deletedProperties.length, loadingDeleted]);

  const fetchProperties = async () => {
    try {
      const data = await api.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (propertyId) => {
    setConfirmDeleteId(propertyId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeleting(true);
      await api.deleteProperty(confirmDeleteId);
      showSuccess('Property deleted', 'Success');
      setProperties(prev => prev.filter(p => p.id !== confirmDeleteId));
      fetchProperties();
    } catch (error) {
      showError(error.message || 'Error deleting property', 'Error');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handlePropertyUpdate = (updatedProperty) => {
    if (!updatedProperty) {
      // Some child actions call onUpdate() with no args; fallback to refresh
      fetchProperties();
      return;
    }
    setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading properties...</Typography>
      </Container>
    );
  }

  const combinedList = showDeleted ? [...properties, ...deletedProperties] : properties;
  const filteredCombined = filterProperties(combinedList);
  const visible = filteredCombined.filter((p) => {
    const isRegular = !p.archived && !p.deleted;
    if (!showRegular && isRegular) return false;
    if (!showArchived && p.archived) return false;
    if (!showDeleted && p.deleted) return false;
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" sx={{ m: 0 }}>
          Property Listings
        </Typography>
      </Box>

      {/* Centralized Search & Filters */}
      <Box sx={{ mb: 2 }}>
        <SearchFilter properties={combinedList} showAdvanced={true} pageKey="properties" />
      </Box>

      {/* Toggle Row - consistent with Follow-Ups */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showRegular}
              onChange={(e) => setShowRegular(e.target.checked)}
              color="primary"
            />
          }
          label="Show Regular"
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              color="primary"
            />
          }
          label="Show Archived"
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              color="primary"
            />
          }
          label={loadingDeleted && showDeleted ? 'Loading deleted…' : 'Show Deleted'}
        />
      </Box>

      {/* Results count */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="textSecondary">
          {visible.length} {visible.length === 1 ? 'property' : 'properties'} found
        </Typography>
      </Box>

      {/* Property Grid using unified PropertyCard actions */}
      <PropertyGrid 
        properties={visible}
        loading={loading}
        onDelete={handleDelete}
        onPropertyUpdate={handlePropertyUpdate}
        onUpdate={fetchProperties}
        showFollowUpBadge={true}
        variant="outlined"
        compact={true}
      />

      <ConfirmationDialog
        open={Boolean(confirmDeleteId)}
        title="Delete Property"
        message="Are you sure you want to delete this property? This action can be undone from Deleted items."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
        loading={deleting}
      />

      {visible.length === 0 && (
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No properties found
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default PropertyList; 