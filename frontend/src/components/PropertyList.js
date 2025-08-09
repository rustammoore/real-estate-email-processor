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

function PropertyList() {
  const { updateDynamicFields, filterProperties } = useSearch();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setMessage] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedProperties, setDeletedProperties] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

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

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.deleteProperty(propertyId);
        setMessage('Property deleted successfully!');
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        fetchProperties();
      } catch (error) {
        setMessage('Error deleting property: ' + error.message);
      }
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                color="primary"
              />
            }
            label="Show archived"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                color="primary"
              />
            }
            label={loadingDeleted && showDeleted ? 'Loading deleted…' : 'Show deleted'}
          />
        </Box>
      </Box>

      {/* Centralized Search & Filters */}
      <Box sx={{ mb: 3 }}>
        <SearchFilter properties={combinedList} showAdvanced={true} />
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {visible.length} {visible.length === 1 ? 'property' : 'properties'} found
          </Typography>
        </Box>
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