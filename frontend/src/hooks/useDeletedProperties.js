import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils';
import { SUCCESS_MESSAGES } from '../constants';

export const useDeletedProperties = () => {
  const [deletedProperties, setDeletedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useToast();

  const fetchDeletedProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDeletedProperties();
      setDeletedProperties(data);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const restoreProperty = useCallback(async (propertyId) => {
    try {
      setLoading(true);
      await api.restoreProperty(propertyId);
      setDeletedProperties(prev => 
        prev.filter(property => property.id !== propertyId)
      );
      showSuccess(SUCCESS_MESSAGES.PROPERTY_RESTORED);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  const permanentlyDeleteProperty = useCallback(async (propertyId) => {
    try {
      setLoading(true);
      await api.permanentlyDeleteProperty(propertyId);
      setDeletedProperties(prev => 
        prev.filter(property => property.id !== propertyId)
      );
      showSuccess('Property permanently deleted');
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  useEffect(() => {
    fetchDeletedProperties();
  }, [fetchDeletedProperties]);

  return {
    deletedProperties,
    loading,
    error,
    fetchDeletedProperties,
    restoreProperty,
    permanentlyDeleteProperty
  };
}; 