import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, TextField, Button, Grid, Box, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import PropertyPageLayout from './layout/PropertyPageLayout';
import api from '../services/api';
import { PROPERTY_CONTEXTS, getInitialFormData, getFieldsForContext, PROPERTY_SECTIONS, getEnumOptions } from '../constants/propertySchema';
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

  // enum options are pulled on-demand per field below

  // Stable loader for edit mode
  const loadPropertyData = useCallback(async () => {
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
  }, [actualPropertyId]);

  // Load property data for edit mode
  useEffect(() => {
    if (mode === 'edit' && actualPropertyId) {
      loadPropertyData();
    }
  }, [mode, actualPropertyId, loadPropertyData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Currency helpers for price field and computed price_per_ft
  const parseCurrencyToNumber = (value) => {
    if (value === null || value === undefined) return NaN;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : NaN;
  };

  const formatCurrencyUSD = (num) => {
    if (!Number.isFinite(num)) return '';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    } catch (_) {
      return `$${num.toFixed(2)}`;
    }
  };

  // Recompute price_per_ft when price or square_feet change
  useEffect(() => {
    const priceNum = parseCurrencyToNumber(formData.price);
    const sqftNum = parseCurrencyToNumber(formData.square_feet);
    if (Number.isFinite(priceNum) && Number.isFinite(sqftNum) && sqftNum > 0) {
      const ppf = priceNum / sqftNum;
      const formatted = formatCurrencyUSD(ppf);
      setFormData((prev) => (
        prev.price_per_ft === formatted ? prev : { ...prev, price_per_ft: formatted }
      ));
    } else if (formData.price_per_ft) {
      setFormData((prev) => ({ ...prev, price_per_ft: '' }));
    }
  }, [formData.price, formData.square_feet]);

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
      price_per_ft: '',
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

  // Prepare fields for left/right cards to mirror Edit Property layout
  const visibleFields = getFieldsForContext(mode === 'edit' ? PROPERTY_CONTEXTS.EDIT : PROPERTY_CONTEXTS.CREATE);
  const leftFields = visibleFields.filter((f) => f.type !== 'images' && f.section !== PROPERTY_SECTIONS.ADDITIONAL);
  const rightFields = (() => {
    const fields = visibleFields.filter((f) => f.section === PROPERTY_SECTIONS.ADDITIONAL);
    const sortOrder = ['price', 'cap_rate'];
    return fields.sort((a, b) => {
      const ai = sortOrder.indexOf(a.name);
      const bi = sortOrder.indexOf(b.name);
      const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      if (av !== bv) return av - bv;
      return 0;
    });
  })();

  return (
    <PropertyPageLayout title={mode === 'create' ? 'Add New Property' : 'Edit Property'} onBack={() => navigate(getBackUrl())} dense>
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 1 }}>
          {message}
        </Alert>
      )}

      {/* Property Images section at the top (mirrors View Property layout) */}
      <Card sx={{ mb: 1 }}>
        <CardContent sx={{ py: 1, px: 1.5 }}>
          <Typography variant="h6" gutterBottom>
            Property Images
          </Typography>
          <ImageManager
            mode={mode === 'create' ? 'create' : 'edit'}
            value={formData.images}
            onChange={(imgs) => setFormData((prev) => ({ ...prev, images: imgs }))}
            columns={3}
            tileHeight={240}
            dropzoneSize={160}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ py: 0.25, px: 1 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={1}>
              {/* Left: Property Details */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent sx={{ py: 1, px: 1.5 }}>
                    <Typography variant="h6" gutterBottom>
                      Property Details
                    </Typography>
                    <Grid container spacing={0.5}>
                      {leftFields.map((field) => {
                        if (field.type === 'enum') {
                          const options = getEnumOptions(field.name);
                          return (
                              <Grid item xs={12} sm={field.ui?.grid?.sm || (field.name === 'description' ? 12 : 6)} key={field.name}>
                              <FormControl fullWidth size="small" margin="dense">
                                <InputLabel>{field.label}</InputLabel>
                                <Select
                                  value={formData[field.name] || ''}
                                  label={field.label}
                                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                                >
                                  {options.map((opt) => (
                                    <MenuItem key={opt} value={opt}>{String(opt)}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                          );
                        }
                        return (
                            <Grid item xs={12} sm={field.ui?.grid?.sm || (field.name === 'description' ? 12 : 6)} key={field.name}>
                            <TextField
                              fullWidth
                              label={`${field.label}${field.required ? ' *' : ''}`}
                              value={formData[field.name] ?? ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                              required={Boolean(field.required)}
                              margin="dense"
                              multiline={Boolean(field.ui?.multiline) || field.name === 'description'}
                              rows={field.ui?.rows || (field.name === 'description' ? 4 : undefined)}
                              size="small"
                                disabled={field.name === 'price_per_ft'}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right: Additional Information */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ py: 1, px: 1.5 }}>
                    <Typography variant="h6" gutterBottom>
                      Additional Information
                    </Typography>
                    {rightFields.map((field) => (
                      <Box sx={{ mb: 1 }} key={field.name}>
                        <TextField
                          fullWidth
                          label={field.label}
                          value={formData[field.name] ?? ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          onBlur={(e) => {
                            if (field.name === 'price') {
                              const num = parseCurrencyToNumber(e.target.value);
                              const formatted = Number.isFinite(num) ? formatCurrencyUSD(num) : '';
                              handleInputChange('price', formatted);
                            }
                          }}
                          size="small"
                          margin="dense"
                          multiline={Boolean(field.ui?.multiline)}
                          rows={field.ui?.rows || (field.ui?.multiline ? 2 : undefined)}
                        />
                      </Box>
                    ))}

                    {/* Create-mode actions placed under Additional Information (to match Edit page) */}
                    {mode === 'create' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => navigate(getBackUrl())}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          startIcon={<SaveIcon />}
                          disabled={loading || !isFormValid()}
                        >
                          {loading ? 'Adding Property...' : 'Add Property'}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Bottom submit row (kept for non-create modes, currently unused) */}
              {mode !== 'create' && (
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
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>
    </PropertyPageLayout>
  );
}

export default PropertyForm; 