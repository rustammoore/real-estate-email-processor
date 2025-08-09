import { useState, useEffect } from 'react';
import { getArchivedProperties } from '../services/api';

export const useArchivedProperties = () => {
  const [archivedProperties, setArchivedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArchivedProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const properties = await getArchivedProperties();
      setArchivedProperties(properties);
    } catch (err) {
      console.error('Error fetching archived properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedProperties();
  }, []);

  return {
    archivedProperties,
    loading,
    error,
    fetchArchivedProperties
  };
};