import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Button, Grid, Box, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import PropertyPageLayout from './layout/PropertyPageLayout';
import api from '../services/api';
import { PROPERTY_CONTEXTS, getInitialFormData, getFieldsForContext, PROPERTY_FIELDS_MAP, PROPERTY_SECTIONS, getEnumOptions } from '../constants/propertySchema';
import ImageManager from './ui/ImageManager';
import { normalizeImages } from '../utils/images';

import { usePendingReview } from '../hooks/usePendingReview';

function PropertyForm({ mode = 'create', propertyId = null, onSuccess = null }) {
  const navigate = useNavigate();
  const params = useParams();
  const { fetchPendingReview: refreshPendingCount } = usePendingReview();
  
  // Use propertyId from props or from URL params
  const actualPropertyId = propertyId || params.id;
  const [formData, setFormData] = useState(() => getInitialFormData(mode === 'edit' ? PROPERTY_CONTEXTS.EDIT : PROPERTY_CONTEXTS.CREATE));
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');

  const propertyTypes = getEnumOptions('property_type');
  const statusOptions = getEnumOptions('status');

  // Load property data for edit mode
  useEffect(() => {
    if (mode === 'edit' && actualPropertyId) {
      loadPropertyData();
    }
  }, [mode, actualPropertyId]);

  const loadPropertyData = async () => {
    try {
      const property = await api.getProperty(actualPropertyId);
      
      // Normalize images from backend to clean string[]
      const images = normalizeImages(property.images);

      // Merge into initial structure based on schema
      const base = getInitialFormData(PROPERTY_CONTEXTS.EDIT);
      const merged = { ...base, ...property, images };
      setFormData(merged);

      // No local image URL list; managed via ImageManager
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

  // Images are managed centrally by ImageManager

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
      cap_rate: '',
      location: '',
      property_type: '',
      sub_type: '',
      square_feet: '',
      acre: '',
      year_built: '',
      bedrooms: '',
      bathrooms: '',
      property_url: '',
      for_lease_info: '',
      other: '',
      email_source: '',
      email_subject: '',
      status: 'active',
      images: []
    });
    // images cleared by resetting formData
  };

  const isFormValid = () => {
    const requiredFields = getFieldsForContext(mode === 'edit' ? PROPERTY_CONTEXTS.EDIT : PROPERTY_CONTEXTS.CREATE)
      .filter(f => f.required)
      .map(f => f.name);
    return requiredFields.every((name) => {
      const value = formData[name];
      if (Array.isArray(value)) return true;
      return String(value ?? '').trim() !== '';
    });
  };

  const getBackUrl = () => {
    if (mode === 'edit') {
      return actualPropertyId ? `/properties/${actualPropertyId}` : '/properties';
    }
    return '/properties';
  };

  if (initialLoading) {
    return (
      <PropertyPageLayout title={mode === 'create' ? 'Add New Property' : 'Edit Property'} onBack={() => navigate(getBackUrl())} dense>
        <Typography>Loading property...</Typography>
      </PropertyPageLayout>
    );
  }

  // Group fields by section from schema
  const visibleFields = getFieldsForContext(mode === 'edit' ? PROPERTY_CONTEXTS.EDIT : PROPERTY_CONTEXTS.CREATE);
  const fieldsBySection = visibleFields.reduce((acc, field) => {
    const section = field.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {});

  return (
    <PropertyPageLayout title={mode === 'create' ? 'Add New Property' : 'Edit Property'} onBack={() => navigate(getBackUrl())} dense>
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 1 }}>
          {message}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ py: 0.25, px: 1 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={0.25}>
              {Object.entries(fieldsBySection).map(([sectionName, fields]) => (
                <React.Fragment key={sectionName}>
                  <Grid item xs={12}>
                    <Typography variant="overline" sx={{ fontWeight: 'bold', color: 'text.secondary', letterSpacing: 0.5, lineHeight: 1, fontSize: '0.75rem', mt: sectionName === PROPERTY_SECTIONS.BASIC ? 0 : 0.25, mb: 0.25 }}>
                      {sectionName}
                    </Typography>
                  </Grid>
                  {fields.map((field) => {
                    if (field.type === 'images') {
                      return (
                        <Grid item xs={12} key={field.name}>
                          <ImageManager
                            mode={mode === 'create' ? 'create' : 'edit'}
                            value={formData.images}
                            onChange={(imgs) => setFormData((prev) => ({ ...prev, images: imgs }))}
                            columns={3}
                            tileHeight={96}
                            dropzoneSize={160}
                          />
                        </Grid>
                      );
                    }

                    if (field.type === 'enum') {
                      const options = getEnumOptions(field.name);
                      return (
                        <Grid item xs={12} sm={6} key={field.name}>
                          <FormControl fullWidth size="small" margin="dense" sx={{ mb: 0.5 }}>
                            <InputLabel>{field.label}</InputLabel>
                            <Select
                              value={formData[field.name] || ''}
                              label={field.label}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              MenuProps={{
                                PaperProps: {
                                  sx: { '& .MuiMenuItem-root': { minHeight: 28, py: 0.25, fontSize: '0.85rem' } }
                                }
                              }}
                            >
                              {options.map((opt) => (
                                <MenuItem key={opt} value={opt}>{String(opt)}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      );
                    }

                    // default to text field
                    return (
                      <Grid item xs={12} sm={field.ui?.multiline ? 12 : 6} key={field.name}>
                        <TextField
                          fullWidth
                          label={`${field.label}${field.required ? ' *' : ''}`}
                          value={formData[field.name] ?? ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          required={Boolean(field.required)}
                          size="small"
                          placeholder={field.placeholder}
                          multiline={Boolean(field.ui?.multiline)}
                          rows={field.ui?.rows || (field.ui?.multiline ? 2 : undefined)}
                          helperText={field.helperText}
                          margin="dense"
                          sx={{ mb: 0.5 }}
                          FormHelperTextProps={{ sx: { mt: 0.25 } }}
                          InputProps={{
                            sx: { '& .MuiInputBase-input': { py: 0.5 } }
                          }}
                        />
                      </Grid>
                    );
                  })}
                </React.Fragment>
              ))}

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', mt: 0.125 }}>
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