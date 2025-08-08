import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Unarchive as UnarchiveIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PropertyGrid from './PropertyGrid';
import SearchFilter from './ui/SearchFilter';
import { useArchivedProperties } from '../hooks/useArchivedProperties';
import { useSearch } from '../contexts/SearchContext';
import { toggleArchive } from '../services/api';

function ArchivedProperties() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { archivedProperties, loading, fetchArchivedProperties } = useArchivedProperties();
  const { filterProperties } = useSearch();

  const handleUnarchive = async (propertyId) => {
    try {
      await toggleArchive(propertyId);
      setMessage('Property unarchived successfully!');
      fetchArchivedProperties(); // Refresh the list
    } catch (error) {
      setMessage('Error unarchiving property: ' + error.message);
    }
  };

  const filteredProperties = filterProperties(archivedProperties);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Tooltip title="Back to Dashboard">
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Archived Properties
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchArchivedProperties}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {message && (
        <Alert 
          severity={message.includes('Error') ? 'error' : 'success'} 
          sx={{ mb: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <Box mb={3}>
        <SearchFilter 
          properties={archivedProperties} 
          showAdvanced={true}
        />
      </Box>

      <PropertyGrid 
        properties={filteredProperties}
        loading={loading}
        emptyMessage="No archived properties found"
        customActions={(property) => (
          <Tooltip title="Unarchive">
            <IconButton
              size="small"
              onClick={() => handleUnarchive(property.id)}
              sx={{ 
                color: 'success.main',
                '&:hover': { 
                  backgroundColor: 'success.light',
                  color: 'success.dark'
                }
              }}
            >
              <UnarchiveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        variant="outlined"
        compact={false}
        showFollowUpBadge={false}
      />

      <Box mt={3} textAlign="center">
        <Typography variant="body2" color="textSecondary">
          Showing {filteredProperties.length} archived properties
        </Typography>
      </Box>
    </Container>
  );
}

export default ArchivedProperties;