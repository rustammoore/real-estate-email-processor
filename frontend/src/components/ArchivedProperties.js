import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Unarchive as UnarchiveIcon
} from '@mui/icons-material';
import BackButton from './ui/BackButton';
import PropertyGrid from './PropertyGrid';
import SearchFilter from './ui/SearchFilter';
import { useArchivedProperties } from '../hooks/useArchivedProperties';
import { useSearch } from '../contexts/SearchContext';
import { toggleArchive } from '../services/api';

function ArchivedProperties() {
  const [message, setMessage] = useState('');
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
      <Box sx={{ mb: 3 }}>
        <BackButton />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" gutterBottom>
            Archived Properties
          </Typography>
        </Box>
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

      <Box mb={2}>
        <SearchFilter 
          properties={archivedProperties} 
          showAdvanced={true}
        />
      </Box>
      <Box mb={2}>
        <Typography variant="body2" color="textSecondary">
          {filteredProperties.length} archived {filteredProperties.length === 1 ? 'property' : 'properties'} found
        </Typography>
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

      
    </Container>
  );
}

export default ArchivedProperties;