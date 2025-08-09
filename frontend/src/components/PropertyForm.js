import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Button, Grid, Box, Alert, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import PropertyPageLayout from './layout/PropertyPageLayout';
import api from '../services/api';

import { usePendingReview } from '../hooks/usePendingReview';

function PropertyForm({ mode = 'create', propertyId = null, onSuccess = null }) {
  const navigate = useNavigate();
  const params = useParams();
  const { fetchPendingReview: refreshPendingCount } = usePendingReview();
  
  // Use propertyId from props or from URL params
  const actualPropertyId = propertyId || params.id;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    property_type: '',
    square_feet: '',
    bedrooms: '',
    bathrooms: '',
    property_url: '',
    email_source: '',
    email_subject: '',
    status: 'active',
    images: []
  });
  
  const [imageUrls, setImageUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');

  const propertyTypes = [
    'Office',
    'Retail',
    'Industrial',
    'Medical',
    'Restaurant',
    'Mixed-Use',
    'Residential',
    'Warehouse',
    'Other'
  ];

  const statusOptions = [
    'active',
    'sold',
    'pending'
  ];

  // Load property data for edit mode
  useEffect(() => {
    if (mode === 'edit' && actualPropertyId) {
      loadPropertyData();
    }
  }, [mode, actualPropertyId]);

  const loadPropertyData = async () => {
    try {
      const property = await api.getProperty(actualPropertyId);
      
      // Parse images if they exist
      let images = [];
      try {
        if (property.images) {
          if (typeof property.images === 'string') {
            // Handle case where images is a JSON string
            images = JSON.parse(property.images);
          } else if (Array.isArray(property.images)) {
            // Handle case where images is an array
            if (property.images.length === 1 && typeof property.images[0] === 'string' && property.images[0].startsWith('[')) {
              // Handle case where images array contains a JSON string
              images = JSON.parse(property.images[0]);
            } else {
              images = property.images;
            }
          }
        }
      } catch (e) {
        console.error('Error parsing images:', e);
        images = [];
      }

      setFormData({
        title: property.title || '',
        description: property.description || '',
        price: property.price || '',
        location: property.location || '',
        property_type: property.property_type || '',
        square_feet: property.square_feet || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        property_url: property.property_url || '',
        email_source: property.email_source || '',
        email_subject: property.email_subject || '',
        status: property.status || 'active',
        images: images
      });

      // Set image URLs for editing
      if (images.length > 0) {
        setImageUrls([...images, '']);
      } else {
        setImageUrls(['']);
      }
    } catch (error) {
      setMessage('Error loading property: ' + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUrlChange = (index, value) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
    
    // Update formData images array
    const filteredImages = newImageUrls.filter(url => url.trim() !== '');
    setFormData(prev => ({
      ...prev,
      images: filteredImages
    }));
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImageUrls);
    
    // Update formData images array
    const filteredImages = newImageUrls.filter(url => url.trim() !== '');
    setFormData(prev => ({
      ...prev,
      images: filteredImages
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Prepare the property data
      const propertyData = {
        ...formData,
        email_source: formData.email_source || 'Manual Entry',
        email_subject: formData.email_subject || `Property: ${formData.title}`,
        email_date: new Date().toISOString()
      };

      let response;
      
      if (mode === 'create') {
        // Create new property
        response = await api.addProperty(propertyData);
        if (response?.isDuplicate) {
          setMessage(`Property added but detected as duplicate. Check the Pending Review page. Original property: ${response.originalProperty?.title || response.originalProperty?.id}`);
          refreshPendingCount(); // Refresh the count in header
          // Reset form even for duplicates
          resetForm();
        } else {
          setMessage('Property added successfully!');
          // Reset form
          resetForm();
        }
      } else {
        // Update existing property
        await api.updateProperty(actualPropertyId, propertyData);
        setMessage('Property updated successfully!');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Default behavior: navigate back to property detail after a short delay
          setTimeout(() => {
            navigate(`/properties/${actualPropertyId}`);
          }, 1500);
        }
      }
    } catch (error) {
      setMessage('Error ' + (mode === 'create' ? 'adding' : 'updating') + ' property: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      location: '',
      property_type: '',
      square_feet: '',
      bedrooms: '',
      bathrooms: '',
      property_url: '',
      email_source: '',
      email_subject: '',
      status: 'active',
      images: []
    });
    setImageUrls(['']);
  };

  const isFormValid = () => {
    return formData.title.trim() !== '' && 
           formData.location.trim() !== '' && 
           formData.description.trim() !== '';
  };

  const getBackUrl = () => {
    if (mode === 'edit') {
      return actualPropertyId ? `/properties/${actualPropertyId}` : '/properties';
    }
    return '/properties';
  };

  if (initialLoading) {
    return (
      <PropertyPageLayout title={mode === 'create' ? 'Add New Property' : 'Edit Property'} onBack={() => navigate(getBackUrl())}>
        <Typography>Loading property...</Typography>
      </PropertyPageLayout>
    );
  }

  return (
    <PropertyPageLayout title={mode === 'create' ? 'Add New Property' : 'Edit Property'} onBack={() => navigate(getBackUrl())}>
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 1 }}>
          {message}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ py: 1, px: 2 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={1}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Property Title *"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location/Address *"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                  helperText="This is used for duplicate detection"
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={2}
                  required
                  size="small"
                />
              </Grid>

              {/* Property Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mt: 0.5 }}>
                  Property Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g., $15,000/month"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Property Type</InputLabel>
                  <Select
                    value={formData.property_type}
                    label="Property Type"
                    onChange={(e) => handleInputChange('property_type', e.target.value)}
                  >
                    {propertyTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Square Feet"
                  value={formData.square_feet}
                  onChange={(e) => handleInputChange('square_feet', e.target.value)}
                  placeholder="e.g., 5,000"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bedrooms"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                  placeholder="e.g., 3 or N/A"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bathrooms"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                  placeholder="e.g., 2"
                  size="small"
                />
              </Grid>

              {/* Status field (only for edit mode) */}
              {mode === 'edit' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      {statusOptions.map(status => (
                        <MenuItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Additional Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mt: 0.5 }}>
                  Additional Information
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Property URL"
                  value={formData.property_url}
                  onChange={(e) => handleInputChange('property_url', e.target.value)}
                  placeholder="https://example.com/property"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Source"
                  value={formData.email_source}
                  onChange={(e) => handleInputChange('email_source', e.target.value)}
                  placeholder="e.g., commercial@realestate.com"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Subject"
                  value={formData.email_subject}
                  onChange={(e) => handleInputChange('email_subject', e.target.value)}
                  placeholder="e.g., New Property Listing"
                  size="small"
                />
              </Grid>

              {/* Image URLs */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mt: 0.5 }}>
                  Property Images
                </Typography>
                
                {imageUrls.map((url, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                    <TextField
                      fullWidth
                      label={`Image URL ${index + 1}`}
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      size="small"
                    />
                    {imageUrls.length > 1 && (
                      <IconButton
                        onClick={() => removeImageUrl(index)}
                        color="error"
                        sx={{ alignSelf: 'center' }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={addImageUrl}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 0.5 }}
                >
                  Add Another Image
                </Button>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 0.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(getBackUrl())}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    disabled={loading || !isFormValid()}
                  >
                    {loading 
                      ? (mode === 'create' ? 'Adding Property...' : 'Updating Property...') 
                      : (mode === 'create' ? 'Add Property' : 'Update Property')
                    }
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </PropertyPageLayout>
  );
}

export default PropertyForm; 