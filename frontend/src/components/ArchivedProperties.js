import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Unarchive as UnarchiveIcon
} from '@mui/icons-material';
import { EyeIcon } from '@heroicons/react/24/outline';
import BackButton from './ui/BackButton';
import PropertyGrid from './PropertyGrid';
import SearchFilter from './ui/SearchFilter';
import { useArchivedProperties } from '../hooks/useArchivedProperties';
import { useSearch } from '../contexts/SearchContext';
import { toggleArchive, updateProperty, deleteProperty as deletePropertyApi } from '../services/api';

function ArchivedProperties() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const { archivedProperties, loading, fetchArchivedProperties } = useArchivedProperties();
  const { filterProperties } = useSearch();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const handleUnarchive = async (propertyId) => {
    try {
      await toggleArchive(propertyId);
      setMessage('Property unarchived successfully!');
      fetchArchivedProperties(); // Refresh the list
    } catch (error) {
      setMessage('Error unarchiving property: ' + error.message);
    }
  };

  const filteredProperties = useMemo(() => filterProperties(archivedProperties), [archivedProperties, filterProperties]);

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      const next = !prev;
      if (!next) setSelectedIds(new Set());
      return next;
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredProperties.map((p) => p.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkUnarchive = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => updateProperty(id, { archived: false })));
      setMessage(`${ids.length} propert${ids.length === 1 ? 'y' : 'ies'} unarchived successfully!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      fetchArchivedProperties();
    } catch (error) {
      setMessage('Error unarchiving selected: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => deletePropertyApi(id)));
      setMessage(`${ids.length} propert${ids.length === 1 ? 'y' : 'ies'} moved to Deleted!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      fetchArchivedProperties();
    } catch (error) {
      setMessage('Error deleting selected: ' + (error?.message || 'Unknown error'));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <BackButton />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" gutterBottom>
            Archived Properties
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            {!selectionMode ? (
              <Button variant="outlined" onClick={toggleSelectionMode} disabled={filteredProperties.length === 0}>
                Select
              </Button>
            ) : (
              <>
                <Button variant="outlined" onClick={selectAll} disabled={filteredProperties.length === 0}>
                  Select All
                </Button>
                <Button variant="outlined" onClick={clearSelection} disabled={selectedIds.size === 0}>
                  Clear
                </Button>
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={handleBulkUnarchive}
                  disabled={selectedIds.size === 0}
                >
                  Unarchive Selected
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                >
                  Delete Selected
                </Button>
                <Button variant="text" onClick={toggleSelectionMode}>
                  Done
                </Button>
              </>
            )}
          </Box>
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
          {selectionMode && (
            <> • {selectedIds.size} selected</>
          )}
        </Typography>
      </Box>

      <PropertyGrid 
        properties={filteredProperties}
        loading={loading}
        emptyMessage="No archived properties found"
        selectMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectOne}
        customActions={(property) => (
          <Box display="flex" gap={0.5}>
            <button
              onClick={() => navigate(`/properties/${property.id}`)}
              title="View Details"
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
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
          </Box>
        )}
        variant="outlined"
        compact={false}
        showFollowUpBadge={true}
      />

      
    </Container>
  );
}

export default ArchivedProperties;