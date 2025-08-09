import { useState, useEffect } from 'react';
import api from '../services/api';

export const useFollowUpCount = () => {
  const [followUpCounts, setFollowUpCounts] = useState({
    due: 0,
    notDue: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCount = async (forceFresh = false) => {
    try {
      setLoading(true);
      const storedCounts = sessionStorage.getItem('followUpCounts');
      if (!forceFresh && storedCounts) {
        const parsed = JSON.parse(storedCounts);
        setFollowUpCounts(parsed);
        return;
      }
      const response = await api.fetchFollowUps();
      if (response && response.counts) {
        setFollowUpCounts(response.counts);
        try {
          sessionStorage.setItem('followUpCounts', JSON.stringify(response.counts));
        } catch (_) {}
      }
    } catch (err) {
      console.error('Error fetching follow-up count:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount(false);
    // Listen for live updates when FollowUps toggles change
    const onCountsChanged = (e) => {
      if (e?.detail?.counts) {
        setFollowUpCounts(e.detail.counts);
      }
    };
    // Also refresh on any property update/delete affecting follow-ups
    const onPropertyChanged = () => fetchCount(true);
    window.addEventListener('followUpCountsChanged', onCountsChanged);
    window.addEventListener('property:updated', onPropertyChanged);
    window.addEventListener('property:deleted', onPropertyChanged);
    return () => {
      window.removeEventListener('followUpCountsChanged', onCountsChanged);
      window.removeEventListener('property:updated', onPropertyChanged);
      window.removeEventListener('property:deleted', onPropertyChanged);
    };
  }, []);

  return { followUpCounts, loading, error, refetch: fetchCount };
};