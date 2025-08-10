import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  RestoreFromTrash as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import BackButton from './ui/BackButton';
import PropertyGrid from './PropertyGrid';
import SearchFilter from './ui/SearchFilter';
import api from '../services/api';
import { useDeletedProperties } from '../hooks/useDeletedProperties';
import { usePendingReview } from '../hooks/usePendingReview';
import { useSearch } from '../contexts/SearchContext';

function DeletedProperties() {
  const [deletedProperties, setDeletedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: '',
    propertyId: null,
    propertyTitle: ''
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const navigate = useNavigate();
  const { fetchDeletedProperties: refreshDeletedProperties } = useDeletedProperties();
  const { fetchPendingReview } = usePendingReview();
  const { filterProperties, updateDynamicFields } = useSearch();

  useEffect(() => {
    fetchDeletedProperties();
  }, []);

  useEffect(() => {
    if (deletedProperties && deletedProperties.length > 0) {
      updateDynamicFields(deletedProperties);
    }
  }, [deletedProperties, updateDynamicFields]);

  const fetchDeletedProperties = async () => {
    try {
      setLoading(true);
      const data = await api.getDeletedProperties();
      setDeletedProperties(data);
    } catch (error) {
      console.error('Error fetching deleted properties:', error);
      setMessage('Error fetching deleted properties: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeleted = useMemo(() => filterProperties(deletedProperties), [deletedProperties, filterProperties]);

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

  const selectAll = () => {
    setSelectedIds(new Set(filteredDeleted.map((p) => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkPermanentDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      // Fire deletes in parallel
      await Promise.all(ids.map((id) => api.permanentlyDeleteProperty(id)));
      setMessage(`${ids.length} propert${ids.length === 1 ? 'y' : 'ies'} permanently deleted!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      fetchDeletedProperties();
      refreshDeletedProperties();
    } catch (error) {
      setMessage('Error deleting selected: ' + error.message);
    }
  };

  const handleRestore = async (propertyId) => {
    try {
      const response = await api.restoreProperty(propertyId);
      setMessage(response.message || 'Property restored successfully!');
      fetchDeletedProperties(); // Refresh the list
      refreshDeletedProperties(); // Refresh the deleted count in header
      fetchPendingReview(); // Refresh the pending review count in header
    } catch (error) {
      setMessage('Error restoring property: ' + error.message);
    }
  };

  const handlePermanentDelete = async (propertyId) => {
    try {
      await api.permanentlyDeleteProperty(propertyId);
      setMessage('Property permanently deleted!');
      fetchDeletedProperties(); // Refresh the list
      refreshDeletedProperties(); // Refresh the count in header
    } catch (error) {
      setMessage('Error permanently deleting property: ' + error.message);
    }
  };

  const openConfirmDialog = (action, propertyId, propertyTitle) => {
    setConfirmDialog({
      open: true,
      action,
      propertyId,
      propertyTitle
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      action: '',
      propertyId: null,
      propertyTitle: ''
    });
  };

  const handleConfirmAction = async () => {
    const { action, propertyId } = confirmDialog;
    
    if (action === 'restore') {
      await handleRestore(propertyId);
    } else if (action === 'permanent-delete') {
      await handlePermanentDelete(propertyId);
    } else if (action === 'bulk-permanent-delete') {
      await handleBulkPermanentDelete();
    }
    
    closeConfirmDialog();
  };

  const getConfirmDialogTitle = () => {
    const { action } = confirmDialog;
    if (action === 'restore') {
      return 'Restore Property';
    } else if (action === 'permanent-delete') {
      return 'Permanently Delete Property';
    } else if (action === 'bulk-permanent-delete') {
      return 'Permanently Delete Selected';
    }
    return 'Confirm Action';
  };

  const getConfirmDialogContent = () => {
    const { action, propertyTitle } = confirmDialog;
    if (action === 'restore') {
      return `Are you sure you want to restore "${propertyTitle}"? This will make it active again.`;
    } else if (action === 'permanent-delete') {
      return `Are you sure you want to permanently delete "${propertyTitle}"? This action cannot be undone.`;
    } else if (action === 'bulk-permanent-delete') {
      const count = selectedIds.size;
      return `Are you sure you want to permanently delete ${count} selected propert${count === 1 ? 'y' : 'ies'}? This cannot be undone.`;
    }
    return '';
  };

  const customActions = (property) => (
    <Box sx={{ display: 'flex', gap: 0.5, width: '100%', alignItems: 'center' }}>
      <button
        onClick={() => navigate(`/properties/${property.id}`)}
        title="View Details"
        className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center transition-colors"
      >
        <EyeIcon className="w-4 h-4" />
      </button>
      <Tooltip title="Restore Property">
        <IconButton
          size="small"
          color="success"
          onClick={() => openConfirmDialog('restore', property.id, property.title)}
          sx={{ 
            backgroundColor: 'success.light',
            color: 'white',
            '&:hover': { backgroundColor: 'success.main' }
          }}
        >
          <RestoreIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Permanently Delete">
        <IconButton
          size="small"
          color="error"
          onClick={() => openConfirmDialog('permanent-delete', property.id, property.title)}
          sx={{ 
            backgroundColor: 'error.light',
            color: 'white',
            '&:hover': { backgroundColor: 'error.main' }
          }}
        >
          <DeleteForeverIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <BackButton />
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" gutterBottom>
            Deleted Properties
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            {!selectionMode ? (
              <Button variant="outlined" onClick={toggleSelectionMode} disabled={filteredDeleted.length === 0}>
                Select
              </Button>
            ) : (
              <>
                <Button variant="outlined" onClick={selectAll} disabled={filteredDeleted.length === 0}>
                  Select All
                </Button>
                <Button variant="outlined" onClick={clearSelection} disabled={selectedIds.size === 0}>
                  Clear
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={() => openConfirmDialog('bulk-permanent-delete', null, '')}
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

      {/* Search Filter */}
      <SearchFilter properties={deletedProperties} showAdvanced={true} />

      {/* Results count */}
      <Box mb={2}>
        <Typography variant="body2" color="textSecondary">
          {filteredDeleted.length} deleted {filteredDeleted.length === 1 ? 'property' : 'properties'} found
          {selectionMode && (
            <>
              {' '}• {selectedIds.size} selected
            </>
          )}
        </Typography>
      </Box>

      <PropertyGrid 
        properties={filteredDeleted}
        customActions={customActions}
        emptyMessage="No deleted properties found"
        loading={loading}
        variant="outlined"
        showFollowUpBadge={true}
        selectMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectOne}
        onFollowUpSet={(propertyId, days) => {
          // Follow-up set - refresh the list
          fetchDeletedProperties();
        }}
        onFollowUpRemoved={(propertyId) => {
          // Follow-up removed - refresh the list
          fetchDeletedProperties();
        }}
        onPropertyUpdate={(updatedProperty) => {
          // Property update - refresh the list
          fetchDeletedProperties();
        }}
        onUpdate={() => {
          // Refresh the list
          fetchDeletedProperties();
        }}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>{getConfirmDialogTitle()}</DialogTitle>
        <DialogContent>
          <Typography>{getConfirmDialogContent()}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.action === 'restore' ? 'success' : 'error'}
          >
            {confirmDialog.action === 'restore' ? 'Restore' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DeletedProperties; 