import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useFollowUpCount = () => {
  const [followUpCounts, setFollowUpCounts] = useState({
    due: 0,
    notDue: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recomputeCounts = async () => {
    const response = await api.fetchFollowUps();
    return response && response.counts ? response.counts : { due: 0, notDue: 0, total: 0 };
  };

  const fetchCount = useCallback(async (preferStored = true) => {
    try {
      setLoading(true);
      // Prefer counts derived from current FollowUps filter state if available (only on mount or explicit opt-in)
      const storedCounts = preferStored ? sessionStorage.getItem('followUpCounts') : null;
      if (storedCounts) {
        const parsed = JSON.parse(storedCounts);
        setFollowUpCounts(parsed);
      } else {
        const counts = await recomputeCounts();
        setFollowUpCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching follow-up count:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load can use stored counts for snappier header render
    fetchCount(true);
    // Listen for live updates when FollowUps toggles change
    const onCountsChanged = (e) => {
      if (e?.detail?.counts) {
        setFollowUpCounts(e.detail.counts);
      }
    };
    // Also refresh on any property update/delete affecting follow-ups
    const onPropertyChanged = () => fetchCount(false);
    window.addEventListener('followUpCountsChanged', onCountsChanged);
    window.addEventListener('property:updated', onPropertyChanged);
    window.addEventListener('property:deleted', onPropertyChanged);
    return () => {
      window.removeEventListener('followUpCountsChanged', onCountsChanged);
      window.removeEventListener('property:updated', onPropertyChanged);
      window.removeEventListener('property:deleted', onPropertyChanged);
    };
  }, [fetchCount]);

  return { followUpCounts, loading, error, refetch: fetchCount };
};