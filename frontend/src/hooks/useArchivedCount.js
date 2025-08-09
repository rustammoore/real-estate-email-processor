import { useState, useEffect } from 'react';
import { getArchivedPropertiesCount } from '../services/api';

export const useArchivedCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArchivedCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getArchivedPropertiesCount();
      setCount(result.count || 0);
    } catch (err) {
      console.error('Error fetching archived count:', err);
      setError(err.message);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedCount();
    // Update count instantly on any property update/delete
    const handler = () => fetchArchivedCount();
    window.addEventListener('property:updated', handler);
    window.addEventListener('property:deleted', handler);
    return () => {
      window.removeEventListener('property:updated', handler);
      window.removeEventListener('property:deleted', handler);
    };
  }, []);

  return {
    count,
    loading,
    error,
    refetch: fetchArchivedCount
  };
};