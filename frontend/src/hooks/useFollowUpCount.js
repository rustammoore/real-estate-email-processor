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

  const fetchCount = async () => {
    try {
      setLoading(true);
      // Prefer counts derived from current FollowUps filter state if available
      const storedCounts = sessionStorage.getItem('followUpCounts');
      if (storedCounts) {
        const parsed = JSON.parse(storedCounts);
        setFollowUpCounts(parsed);
      } else {
        const response = await api.fetchFollowUps();
        if (response && response.counts) {
          setFollowUpCounts(response.counts);
        }
      }
    } catch (err) {
      console.error('Error fetching follow-up count:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    // Listen for live updates when FollowUps toggles change
    const handler = (e) => {
      if (e?.detail?.counts) {
        setFollowUpCounts(e.detail.counts);
      }
    };
    window.addEventListener('followUpCountsChanged', handler);
    return () => window.removeEventListener('followUpCountsChanged', handler);
  }, []);

  return { followUpCounts, loading, error, refetch: fetchCount };
};