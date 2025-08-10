import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, Typography, Button, TextField, Grid, Box, Chip, ImageList, ImageListItem, FormControl, InputLabel, Select, MenuItem, Alert, InputAdornment } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { PROPERTY_CONTEXTS, getFieldsForContext, PROPERTY_SECTIONS, getEnumOptions } from '../constants/propertySchema';
import PropertyPageLayout from './layout/PropertyPageLayout';
import FollowUpActions from './ui/FollowUpActions';
import PropertyActions from './ui/PropertyActions';
import ImageManager from './ui/ImageManager';
import { normalizeImages } from '../utils/images';
import ConfirmationDialog from './ui/ConfirmationDialog';
import { useToast } from '../contexts/ToastContext';

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [allProperties, setAllProperties] = useState([]);
  const [prevId, setPrevId] = useState(null);
  const [nextId, setNextId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchProperty();
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const list = await api.getProperties();
        // Sort by createdAt if available, newest first
        const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAllProperties(sorted);
      } catch (e) {
        // ignore
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!allProperties || allProperties.length === 0) return;
    const idx = allProperties.findIndex((p) => String(p.id) === String(id));
    if (idx !== -1) {
      setPrevId(idx < allProperties.length - 1 ? allProperties[idx + 1].id : null);
      setNextId(idx > 0 ? allProperties[idx - 1].id : null);
    } else {
      setPrevId(null);
      setNextId(null);
    }
  }, [allProperties, id]);

  // Enable edit mode when navigated with ?edit=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === '1') {
      setEditing(true);
    }
  }, [location.search]);

  const fetchProperty = async () => {
    try {
      const raw = await api.getProperty(id);
      // Compute price_per_ft for view (even if backend doesn't store it)
      const priceNum = parseCurrencyToNumber(raw.price);
      const sqftNum = parseCurrencyToNumber(raw.square_feet);
      const pricePerFt = (Number.isFinite(priceNum) && Number.isFinite(sqftNum) && sqftNum > 0)
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(priceNum / sqftNum)
        : '';
      const data = { ...raw, price_per_ft: raw.price_per_ft || pricePerFt };
      setProperty(data);
      // Initialize from schema-visible fields for edit context
      const fields = getFieldsForContext(PROPERTY_CONTEXTS.EDIT);
      const next = {};
      fields.forEach((f) => { next[f.name] = data[f.name] ?? (f.defaultValue ?? ''); });
      setFormData(next);
    } catch (error) {
      console.error('Error fetching property:', error);
      setMessage('Error loading property');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Normalize state similar to create flow to avoid backend validation errors
      const payload = { ...formData };
      if (payload.state) {
        const normalized = String(payload.state).replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
        if (normalized.length === 2) payload.state = normalized; else payload.state = undefined;
      }
      const resp = await api.updateProperty(id, payload);
      const updated = resp?.property || null;
      setMessage('Property updated successfully!');
      setEditing(false);
      if (updated) {
        // Broadcast update so dashboard and other views can react immediately
        window.dispatchEvent(new CustomEvent('property:updated', { detail: updated }));
      }
      fetchProperty(); // Refresh data
    } catch (error) {
      setMessage('Error updating property: ' + error.message);
    }
  };

  const handleOpenDelete = () => setConfirmDeleteOpen(true);
  const handleCloseDelete = () => setConfirmDeleteOpen(false);
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await api.deleteProperty(id);
      try { window.dispatchEvent(new CustomEvent('property:deleted', { detail: { id } })); } catch (_) {}
      showSuccess('Property deleted', 'Success');
      navigate('/properties');
    } catch (error) {
      showError(error.message || 'Error deleting property', 'Error');
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleNavigatePrev = () => {
    if (prevId) {
      setEditing(false);
      navigate(`/properties/${prevId}`);
    }
  };

  const handleNavigateNext = () => {
    if (nextId) {
      setEditing(false);
      navigate(`/properties/${nextId}`);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helpers for currency and computed price_per_ft in edit mode
  const parseCurrencyToNumber = (value) => {
    if (value === null || value === undefined) return NaN;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : NaN;
  };

  useEffect(() => {
    if (!editing) return;
    const priceNum = parseCurrencyToNumber(formData.price);
    const sqftNum = parseCurrencyToNumber(formData.square_feet);
    if (Number.isFinite(priceNum) && Number.isFinite(sqftNum) && sqftNum > 0) {
      const ppf = priceNum / sqftNum;
      const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ppf);
      setFormData((prev) => (
        prev.price_per_ft === formatted ? prev : { ...prev, price_per_ft: formatted }
      ));
    } else if (formData.price_per_ft) {
      setFormData((prev) => ({ ...prev, price_per_ft: '' }));
    }
  }, [editing, formData.price, formData.square_feet]);

  if (loading) {
    return (
      <PropertyPageLayout title="View Property" onBack={() => navigate('/properties')}>
        <Typography>Loading property...</Typography>
      </PropertyPageLayout>
    );
  }

  if (!property) {
    return (
      <PropertyPageLayout title="View Property" onBack={() => navigate('/properties')}>
        <Typography>Property not found</Typography>
      </PropertyPageLayout>
    );
  }

  return (
    <>
    <PropertyPageLayout
      title={editing ? 'Edit Property' : 'View Property'}
      onBack={() => navigate('/properties')}
      dense
      actions={
        editing
          ? null
          : (
            <div className="flex justify-center items-center w-full gap-2 flex-wrap">
              {/* View (current) */}
              <button
                title="Viewing"
                className="w-8 h-8 bg-blue-500 text-white rounded-md flex items-center justify-center opacity-60 cursor-default"
                disabled
              >
                <EyeIcon className="w-4 h-4" />
              </button>
              {/* Edit */}
              {/* Reviewed Toggle */}
              <button
                onClick={async () => {
                  try {
                    const updated = await api.toggleReviewed(property.id);
                    showSuccess(updated.message || 'Updated', 'Success');
                    // refresh current property data
                    await fetchProperty();
                    try { window.dispatchEvent(new CustomEvent('property:updated', { detail: updated })); } catch (_) {}
                  } catch (e) {
                    showError(e.message || 'Failed to update reviewed', 'Error');
                  }
                }}
                title={property.reviewed ? 'Unmark Reviewed' : 'Mark Reviewed'}
                className={`w-8 h-8 ${property.reviewed ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-md flex items-center justify-center transition-colors`}
              >
                <CheckCircleIcon className="w-4 h-4" />
              </button>

              {/* Edit */}
              <button
                onClick={() => setEditing(true)}
                title="Edit Property"
                className="w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center justify-center transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              {/* Follow-up Actions */}
              <FollowUpActions property={property} onUpdate={fetchProperty} />
              {/* Property Actions (Like, Love, Rating, Archive) */}
              <PropertyActions property={property} onUpdate={fetchProperty} />
              {/* Delete */}
              <button
                onClick={handleOpenDelete}
                title="Delete Property"
                className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )
      }
    >
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* Prev / Next navigation with centered status ribbons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleNavigatePrev}
          disabled={!prevId}
          startIcon={<ChevronLeftIcon className="w-4 h-4" />}
        >
          Previous
        </Button>
        {(property.deleted || property.archived) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            {property.deleted && (
              <div className="bg-red-600 text-white text-2xs font-bold px-2 py-0.5 rounded">
                DELETED
              </div>
            )}
            {property.archived && (
              <div className="bg-orange-500 text-white text-2xs font-bold px-2 py-0.5 rounded">
                ARCHIVED
              </div>
            )}
          </Box>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={handleNavigateNext}
          disabled={!nextId}
          endIcon={<ChevronRightIcon className="w-4 h-4" />}
        >
          Next
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* Property Images */}
        {(editing || (property.images && property.images.length > 0)) && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ py: 1, px: 1.5 }}>
                <Typography variant="h6" gutterBottom>
                  Property Images
                </Typography>
                <ImageManager
                  mode={editing ? 'edit' : 'view'}
                  value={editing ? formData.images : normalizeImages(property.images)}
                  onChange={(imgs) => editing && setFormData((prev) => ({ ...prev, images: imgs }))}
                  columns={3}
                  tileHeight={240}
                  dropzoneSize={160}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Property Details (schema-driven) */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ py: 1, px: 1.5 }}>
              <Typography variant="h6" gutterBottom>
                Property Details
              </Typography>

              <Grid container spacing={0.5}>
                {getFieldsForContext(editing ? PROPERTY_CONTEXTS.EDIT : PROPERTY_CONTEXTS.VIEW)
                  .filter((f) => f.type !== 'images' && f.section !== PROPERTY_SECTIONS.ADDITIONAL)
                  .map((field) => {
                    const value = editing ? formData[field.name] : property[field.name];
                    if (field.type === 'enum') {
                      const options = getEnumOptions(field.name);
                      return (
                         <Grid item xs={12} sm={field.ui?.grid?.sm || (field.name === 'description' ? 12 : 6)} key={field.name}>
                          <FormControl fullWidth size="small" margin="dense">
                            <InputLabel>{field.label}</InputLabel>
                            <Select
                              value={value || ''}
                              label={field.label}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              disabled={!editing}
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
                          label={field.label}
                          value={value || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                           disabled={!editing || field.name === 'price_per_ft'}
                          margin="dense"
                          multiline={Boolean(field.ui?.multiline) || field.name === 'description'}
                          rows={field.ui?.rows || (field.name === 'description' ? 4 : undefined)}
                          size="small"
                        />
                      </Grid>
                    );
                  })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Information (schema-driven, editable in edit mode) */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ py: 1, px: 1.5 }}>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>

              {(() => {
                const metaFieldNames = [
                  'liked',
                  'loved',
                  'archived',
                  'rating',
                  'followUpDate',
                  'followUpSet',
                  'lastFollowUpDate',
                  'duplicate_of',
                  'createdAt',
                  'updatedAt',
                ];

                const additionalFields = getFieldsForContext(editing ? PROPERTY_CONTEXTS.EDIT : PROPERTY_CONTEXTS.VIEW)
                  .filter((f) => f.section === PROPERTY_SECTIONS.ADDITIONAL && !metaFieldNames.includes(f.name));

                // Ensure specific ordering in Additional Information
                // Also place Date Received before Email Subject
                const sortOrder = ['price', 'cap_rate', 'property_url', 'email_source', 'email_date', 'email_subject'];
                additionalFields.sort((a, b) => {
                  const ai = sortOrder.indexOf(a.name);
                  const bi = sortOrder.indexOf(b.name);
                  const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
                  const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
                  if (av !== bv) return av - bv;
                  return 0;
                });

                return (
                  <>
                    {additionalFields.map((field) => {
                      if (editing) {
                        // Editable fields in edit context (text & numeric)
                        if (field.type === 'text' || field.type === 'numeric') {
                          return (
                            <Box sx={{ mb: 1 }} key={field.name}>
                              <TextField
                                fullWidth
                                label={field.name === 'cap_rate' ? `${field.label} (%)` : field.label}
                                value={formData[field.name] ?? ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                onBlur={(e) => {
                                  if (field.name === 'price') {
                                    const cleaned = String(e.target.value).replace(/[^0-9.]/g, '');
                                    const num = parseFloat(cleaned);
                                    const formatted = Number.isFinite(num) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(num) : '';
                                    handleInputChange('price', formatted);
                                  } else if (field.name === 'cap_rate') {
                                    const raw = e.target.value || '';
                                    const hasPercent = raw.includes('%');
                                    const cleaned = raw.replace(/[^0-9.\-]/g, '');
                                    const n = parseFloat(cleaned);
                                    if (!Number.isFinite(n)) {
                                      handleInputChange('cap_rate', '');
                                    } else {
                                      const percent = hasPercent ? n : (n <= 1 ? n * 100 : n);
                                      const formatted = `${percent}`;
                                      handleInputChange('cap_rate', formatted);
                                    }
                                  }
                                }}
                                size="small"
                                margin="dense"
                                InputProps={field.name === 'cap_rate' ? { endAdornment: <InputAdornment position="end">%</InputAdornment> } : undefined}
                              />
                            </Box>
                          );
                        }
                        // Skip non-editable types in edit context
                        return null;
                      }

                      // View mode presentation
                      // Single-row layout for specific fields with wrapping
                      const isSingleRowField = ['price', 'cap_rate', 'email_source', 'email_subject'].includes(field.name);

                      if (field.name === 'property_url' && property.property_url) {
                        return (
                          <Box
                            key={field.name}
                            sx={{
                              mb: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography variant="subtitle2" color="textSecondary">
                              Property URL:
                            </Typography>
                            <Button
                              href={property.property_url}
                              target="_blank"
                              variant="outlined"
                              size="small"
                              sx={{ minWidth: 0, px: 1.25, py: 0.25 }}
                            >
                              View
                            </Button>
                          </Box>
                        );
                      }

                      if (field.name === 'email_date' && property[field.name]) {
                        return (
                          <Box
                            key={field.name}
                            sx={{
                              mb: 1,
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: 1,
                              flexWrap: 'nowrap',
                            }}
                          >
                            <Typography variant="subtitle2" color="textSecondary">
                              {field.label}:
                            </Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', flex: 1, minWidth: 0 }}>
                              {new Date(property[field.name]).toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      }

                      if (isSingleRowField) {
                        return (
                          <Box
                            key={field.name}
                            sx={{
                              mb: 1,
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: 1,
                              flexWrap: 'nowrap',
                            }}
                          >
                            <Typography variant="subtitle2" color="textSecondary">
                              {field.label}:
                            </Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', flex: 1, minWidth: 0 }}>
                              {property[field.name] || ''}
                            </Typography>
                          </Box>
                        );
                      }

                      if (field.type === 'date' && property[field.name]) {
                        return (
                          <Box sx={{ mb: 1 }} key={field.name}>
                            <Typography variant="subtitle2" color="textSecondary">
                              {field.label}:
                            </Typography>
                            <Typography variant="body2">
                              {new Date(property[field.name]).toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      }

                      return (
                        <Box sx={{ mb: 1 }} key={field.name}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {field.label}:
                          </Typography>
                          <Typography variant="body2">
                            {property[field.name] || ''}
                          </Typography>
                        </Box>
                      );
                    })}
                    {editing && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                        <Button variant="outlined" size="large" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
                          Save
                        </Button>
                      </Box>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Interactions & Activity (view-only) */}
          {!editing && (
            <Box sx={{ mt: 2 }}>
              <Card>
                <CardContent sx={{ py: 1, px: 1.5 }}>
                <Typography variant="h6" gutterBottom>
                  Interactions & Activity
                </Typography>

                {/* Compact chips row */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {/* Liked - blue when true */}
                  <Chip
                    size="small"
                    label="Liked"
                    variant={property.liked ? 'filled' : 'outlined'}
                    sx={property.liked ? { bgcolor: '#1e88e5', color: '#fff' } : {}}
                  />
                  {/* Loved - red when true */}
                  <Chip
                    size="small"
                    label="Loved"
                    variant={property.loved ? 'filled' : 'outlined'}
                    sx={property.loved ? { bgcolor: '#e53935', color: '#fff' } : {}}
                  />
                  <Chip
                    size="small"
                    label="Archived"
                    color={property.archived ? 'warning' : 'default'}
                    variant={property.archived ? 'filled' : 'outlined'}
                  />
                  <Chip
                    size="small"
                    label="Reviewed"
                    color={property.reviewed ? 'success' : 'default'}
                    variant={property.reviewed ? 'filled' : 'outlined'}
                  />
                  {(() => {
                    const ratingValue = Number(property.rating);
                    const hasNumeric = Number.isFinite(ratingValue);
                    const clamped = hasNumeric ? Math.max(0, Math.min(10, Math.round(ratingValue))) : null;
                    const label = hasNumeric ? `Rating ${clamped}` : 'No rating';
                    const gradient = ['#000000', '#00897B', '#009688', '#00ACC1', '#26A69A', '#42B3B3', '#5C6BC0', '#7E57C2', '#8E24AA', '#9C27B0', '#6A1B9A'];
                    const color = hasNumeric ? gradient[clamped] : undefined;
                    const sx = hasNumeric ? { bgcolor: color, color: '#fff' } : {};
                    const variant = hasNumeric ? 'filled' : 'outlined';
                    return (
                      <Chip size="small" label={label} variant={variant} sx={sx} />
                    );
                  })()}
                  {'status' in property && (
                    <Chip
                      size="small"
                      label={(property.status || '').toString().charAt(0).toUpperCase() + (property.status || '').toString().slice(1)}
                      color={property.status === 'active' ? 'success' :
                             property.status === 'sold' ? 'error' : 'warning'}
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Dense two-column meta grid with single-row label/value */}
                <Grid container spacing={0.5} columns={12}>
                  <Grid item xs={12} sm={12}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'nowrap' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>Follow-up Date:</Typography>
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {property.followUpDate ? new Date(property.followUpDate).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'nowrap' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>Follow-up Set:</Typography>
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {property.followUpSet ? new Date(property.followUpSet).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'nowrap' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>Last Follow-up:</Typography>
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {property.lastFollowUpDate ? new Date(property.lastFollowUpDate).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'nowrap' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>Duplicate Of:</Typography>
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {property.duplicate_of || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'nowrap' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>Created At:</Typography>
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {property.createdAt ? new Date(property.createdAt).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'nowrap' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>Updated At:</Typography>
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {property.updatedAt ? new Date(property.updatedAt).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </Grid>
      </Grid>
    </PropertyPageLayout>
    {/* Delete Confirmation Dialog */}
    <ConfirmationDialog
      open={confirmDeleteOpen}
      title="Delete Property"
      message="Are you sure you want to delete this property? This action can be undone from Deleted items."
      confirmText="Delete"
      cancelText="Cancel"
      severity="error"
      onConfirm={handleConfirmDelete}
      onCancel={handleCloseDelete}
      loading={deleting}
    />
    </>
  );
}

export default PropertyDetail; 