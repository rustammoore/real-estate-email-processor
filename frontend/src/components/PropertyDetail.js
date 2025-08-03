import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Box,
  Chip,
  ImageList,
  ImageListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProperty();
  }, [id]);

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
      await api.updateProperty(id, formData);
      setMessage('Property updated successfully!');
      setEditing(false);
      fetchProperty(); // Refresh data
    } catch (error) {
      setMessage('Error updating property: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.deleteProperty(id);
        navigate('/properties');
      } catch (error) {
        setMessage('Error deleting property: ' + error.message);
      }
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading property...</Typography>
      </Container>
    );
  }

  if (!property) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Property not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/properties')}
          sx={{ mb: 2 }}
        >
          Back to Properties
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">
            {editing ? 'Edit Property' : property.title}
          </Typography>
          
          <Box>
            {editing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setEditing(true)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </>
            )}
          </Box>
        </Box>
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
    </Container>
  );
}

export default PropertyDetail; 