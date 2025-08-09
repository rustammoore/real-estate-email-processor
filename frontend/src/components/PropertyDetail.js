import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, Typography, Button, TextField, Grid, Box, Chip, ImageList, ImageListItem, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import PropertyPageLayout from './layout/PropertyPageLayout';
import FollowUpActions from './ui/FollowUpActions';
import PropertyActions from './ui/PropertyActions';

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
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price || '',
        location: data.location || '',
        property_type: data.property_type || '',
        square_feet: data.square_feet || '',
        bedrooms: data.bedrooms || '',
        bathrooms: data.bathrooms || '',
        status: data.status || 'active'
      });
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
      actions={
        editing ? (
          <>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} size="small">
              Save
            </Button>
            <Button variant="outlined" onClick={() => setEditing(false)} size="small">
              Cancel
            </Button>
          </>
        ) : (
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

      {/* Prev / Next navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleNavigatePrev}
          disabled={!prevId}
          startIcon={<ChevronLeftIcon className="w-4 h-4" />}
        >
          Previous
        </Button>
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

      <Grid container spacing={3}>
        {/* Property Images */}
        {property.images && property.images.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Property Images
                </Typography>
                <ImageList cols={3} rowHeight={200}>
                  {property.images.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        loading="lazy"
                        style={{ objectFit: 'cover' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Property Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Property Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={editing ? formData.title : property.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price"
                    value={editing ? formData.price : property.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={editing ? formData.location : property.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Property Type"
                    value={editing ? formData.property_type : property.property_type}
                    onChange={(e) => handleInputChange('property_type', e.target.value)}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Square Feet"
                    value={editing ? formData.square_feet : property.square_feet}
                    onChange={(e) => handleInputChange('square_feet', e.target.value)}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Bedrooms"
                    value={editing ? formData.bedrooms : property.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Bathrooms"
                    value={editing ? formData.bathrooms : property.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={editing ? formData.description : property.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!editing}
                    multiline
                    rows={4}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editing ? formData.status : property.status}
                      label="Status"
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={!editing}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="sold">Sold</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Property URL and Email Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>

              {property.property_url && (
                <Box sx={{ mb: 2 }}>
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
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Email Source:
                </Typography>
                <Typography variant="body2">
                  {property.email_source}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Email Subject:
                </Typography>
                <Typography variant="body2">
                  {property.email_subject}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Date Received:
                </Typography>
                <Typography variant="body2">
                  {new Date(property.email_date).toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Status:
                </Typography>
                <Chip
                  label={property.status}
                  color={property.status === 'active' ? 'success' : 
                         property.status === 'sold' ? 'error' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PropertyPageLayout>
  );
}

export default PropertyDetail; 