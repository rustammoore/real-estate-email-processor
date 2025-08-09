import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import { useSearch } from '../contexts/SearchContext';
import PropertyGrid from './PropertyGrid';

function PropertyList() {
  const { updateDynamicFields } = useSearch();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter]);

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

  const filterProperties = () => {
    let filtered = properties;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.email_source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    setFilteredProperties(filtered);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'sold': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading properties...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Property Listings
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search properties"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="textSecondary">
              {filteredProperties.length} properties found
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Property Grid using unified PropertyCard actions */}
      <PropertyGrid 
        properties={filteredProperties}
        loading={loading}
        onDelete={handleDelete}
        onPropertyUpdate={handlePropertyUpdate}
        onUpdate={fetchProperties}
        showFollowUpBadge={true}
        variant="outlined"
      />

      {filteredProperties.length === 0 && (
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