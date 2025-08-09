import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export const useDeletedCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDeletedProperties();
      setCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      setError(err);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    // Update instantly on delete/restore and any update that toggles deleted
    const handler = () => refetch();
    window.addEventListener('property:updated', handler);
    window.addEventListener('property:deleted', handler);
    return () => {
      window.removeEventListener('property:updated', handler);
      window.removeEventListener('property:deleted', handler);
    };
  }, [refetch]);

  return { count, loading, error, refetch };
};