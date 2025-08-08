import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils';
import { SUCCESS_MESSAGES } from '../constants';

export const usePendingReview = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useToast();

  const fetchPendingReview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPendingReviewProperties();
      setPendingProperties(data);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const approveDuplicate = useCallback(async (duplicateId, originalId) => {
    try {
      setLoading(true);
      await api.approveDuplicate(duplicateId, originalId);
      setPendingProperties(prev => 
        prev.filter(property => property.id !== duplicateId)
      );
      showSuccess(SUCCESS_MESSAGES.DUPLICATE_APPROVED);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  const rejectDuplicate = useCallback(async (duplicateId) => {
    try {
      setLoading(true);
      await api.rejectDuplicate(duplicateId);
      setPendingProperties(prev => 
        prev.filter(property => property.id !== duplicateId)
      );
      showSuccess(SUCCESS_MESSAGES.DUPLICATE_REJECTED);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  const getOriginalProperty = useCallback(async (duplicateId) => {
    try {
      setLoading(true);
      const originalProperty = await api.getOriginalProperty(duplicateId);
      return originalProperty;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchPendingReview();
  }, [fetchPendingReview]);

  return {
    pendingProperties,
    loading,
    error,
    fetchPendingReview,
    approveDuplicate,
    rejectDuplicate,
    getOriginalProperty
  };
}; 