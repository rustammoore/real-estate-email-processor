import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSearch } from '../contexts/SearchContext';
import PropertyGrid from './PropertyGrid';
import SearchFilter from './ui/SearchFilter';

function PropertyList() {
  const { updateDynamicFields, filterProperties } = useSearch();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (properties && properties.length > 0) {
      updateDynamicFields(properties);
    }
  }, [properties, updateDynamicFields]);

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

  const filtered = filterProperties(properties);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Property Listings
      </Typography>

      {/* Centralized Search & Filters */}
      <Box sx={{ mb: 3 }}>
        <SearchFilter properties={properties} showAdvanced={true} />
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {filtered.length} {filtered.length === 1 ? 'property' : 'properties'} found
          </Typography>
        </Box>
      </Box>

      {/* Property Grid using unified PropertyCard actions */}
      <PropertyGrid 
        properties={filtered}
        loading={loading}
        onDelete={handleDelete}
        onPropertyUpdate={handlePropertyUpdate}
        onUpdate={fetchProperties}
        showFollowUpBadge={true}
        variant="outlined"
      />

      {filtered.length === 0 && (
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