import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils';

export const useProperties = (filters = {}) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showError } = useToast();

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProperties();
      setProperties(data);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addProperty = useCallback(async (propertyData) => {
    try {
      setLoading(true);
      const createResult = await api.addProperty(propertyData);
      const created = createResult?.property || createResult;
      if (created) {
        setProperties(prev => [created, ...prev]);
      }
      return createResult;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const updateProperty = useCallback(async (id, propertyData) => {
    try {
      setLoading(true);
      await api.updateProperty(id, propertyData);
      setProperties(prev => 
        prev.map(property => 
          property.id === id ? { ...property, ...propertyData } : property
        )
      );
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const deleteProperty = useCallback(async (id) => {
    try {
      setLoading(true);
      await api.deleteProperty(id);
      setProperties(prev => prev.filter(property => property.id !== id));
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const getProperty = useCallback(async (id) => {
    try {
      setLoading(true);
      const property = await api.getProperty(id);
      return property;
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
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    fetchProperties,
    addProperty,
    updateProperty,
    deleteProperty,
    getProperty
  };
}; 