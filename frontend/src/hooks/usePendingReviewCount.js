import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export const usePendingReviewCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPendingReviewProperties();
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
  }, [refetch]);

  return { count, loading, error, refetch };
};