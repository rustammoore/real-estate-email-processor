import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, Typography, Button, TextField, Grid, Box, Chip, ImageList, ImageListItem, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { PROPERTY_CONTEXTS, getFieldsForContext, PROPERTY_SECTIONS, getEnumOptions } from '../constants/propertySchema';
import PropertyPageLayout from './layout/PropertyPageLayout';
import FollowUpActions from './ui/FollowUpActions';
import PropertyActions from './ui/PropertyActions';
import ImageManager from './ui/ImageManager';
import { normalizeImages } from '../utils/images';

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
      const data = await api.getProperty(id);
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
      const resp = await api.updateProperty(id, formData);
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

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.deleteProperty(id);
        // Broadcast delete so dashboard and lists can react immediately
        window.dispatchEvent(new CustomEvent('property:deleted', { detail: { id } }));
        navigate('/properties');
      } catch (error) {
        setMessage('Error deleting property: ' + error.message);
      }
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
                onClick={handleDelete}
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
                         <Grid item xs={12} sm={field.name === 'description' ? 12 : 6} key={field.name}>
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
                       <Grid item xs={12} sm={field.name === 'description' ? 12 : 6} key={field.name}>
                        <TextField
                          fullWidth
                          label={field.label}
                          value={value || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          disabled={!editing}
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

                return (
                  <>
                    {additionalFields.map((field) => {
                      if (editing) {
                        // Editable fields in edit context (text fields)
                        if (field.type === 'text') {
                          return (
                            <Box sx={{ mb: 1 }} key={field.name}>
                              <TextField
                                fullWidth
                                label={field.label}
                                value={formData[field.name] ?? ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                size="small"
                                margin="dense"
                              />
                            </Box>
                          );
                        }
                        // Skip non-editable types in edit context
                        return null;
                      }

                      // View mode presentation
                      if (field.name === 'property_url' && property.property_url) {
                        return (
                          <Box sx={{ mb: 1 }} key={field.name}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Property URL:
                            </Typography>
                            <Button
                              href={property.property_url}
                              target="_blank"
                              variant="outlined"
                              fullWidth
                              sx={{ mt: 1 }}
                            >
                              View Original Listing
                            </Button>
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
                  <Chip
                    size="small"
                    label="Liked"
                    color={property.liked ? 'success' : 'default'}
                    variant={property.liked ? 'filled' : 'outlined'}
                  />
                  <Chip
                    size="small"
                    label="Loved"
                    color={property.loved ? 'success' : 'default'}
                    variant={property.loved ? 'filled' : 'outlined'}
                  />
                  <Chip
                    size="small"
                    label="Archived"
                    color={property.archived ? 'warning' : 'default'}
                    variant={property.archived ? 'filled' : 'outlined'}
                  />
                  <Chip
                    size="small"
                    label={property.rating && property.rating > 0 ? `Rating ${property.rating}` : 'No rating'}
                    color={property.rating && property.rating > 0 ? 'primary' : 'default'}
                    variant={property.rating && property.rating > 0 ? 'filled' : 'outlined'}
                  />
                  {'status' in property && (
                    <Chip
                      size="small"
                      label={`Status: ${property.status}`}
                      color={property.status === 'active' ? 'success' :
                             property.status === 'sold' ? 'error' : 'warning'}
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Dense two-column meta grid */}
                <Grid container spacing={0.5} columns={12}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <span style={{ color: 'rgba(0,0,0,0.6)' }}>Follow-up Date:</span> {property.followUpDate ? new Date(property.followUpDate).toLocaleString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <span style={{ color: 'rgba(0,0,0,0.6)' }}>Follow-up Set:</span> {property.followUpSet ? new Date(property.followUpSet).toLocaleString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <span style={{ color: 'rgba(0,0,0,0.6)' }}>Last Follow-up:</span> {property.lastFollowUpDate ? new Date(property.lastFollowUpDate).toLocaleString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <span style={{ color: 'rgba(0,0,0,0.6)' }}>Duplicate Of:</span> {property.duplicate_of || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <span style={{ color: 'rgba(0,0,0,0.6)' }}>Created At:</span> {property.createdAt ? new Date(property.createdAt).toLocaleString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <span style={{ color: 'rgba(0,0,0,0.6)' }}>Updated At:</span> {property.updatedAt ? new Date(property.updatedAt).toLocaleString() : '-'}
                    </Typography>
                  </Grid>
                </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </Grid>
      </Grid>
    </PropertyPageLayout>
  );
}

export default PropertyDetail; 