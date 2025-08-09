import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const CountsContext = createContext(null);

export function CountsProvider({ children }) {
  const [counts, setCounts] = useState({
    followUps: { due: 0, notDue: 0, total: 0 },
    pendingReview: 0,
    archived: 0,
    deleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [followUpsResp, pendingAll, archivedResp, deletedList] = await Promise.all([
        api.fetchFollowUps(),
        api.getPendingReviewProperties(),
        api.getArchivedPropertiesCount(),
        api.getDeletedProperties(),
      ]);

      // For header/menu: pending review count excludes deleted by default
      const pendingVisible = Array.isArray(pendingAll) ? pendingAll.filter((p) => !p.deleted) : [];

      setCounts({
        followUps: followUpsResp?.counts || { due: 0, notDue: 0, total: 0 },
        pendingReview: pendingVisible.length,
        archived: archivedResp?.count || 0,
        deleted: Array.isArray(deletedList) ? deletedList.length : 0,
      });
    } catch (err) {
      console.error('Error refreshing global counts:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    refreshCounts();

    // Live updates from events
    const onPropertyChanged = () => refreshCounts();
    const onFollowUpCountsChanged = (e) => {
      if (e?.detail?.counts) {
        setCounts((prev) => ({ ...prev, followUps: e.detail.counts }));
      } else {
        refreshCounts();
      }
    };

    window.addEventListener('property:updated', onPropertyChanged);
    window.addEventListener('property:deleted', onPropertyChanged);
    window.addEventListener('followUpCountsChanged', onFollowUpCountsChanged);
    return () => {
      window.removeEventListener('property:updated', onPropertyChanged);
      window.removeEventListener('property:deleted', onPropertyChanged);
      window.removeEventListener('followUpCountsChanged', onFollowUpCountsChanged);
    };
  }, [refreshCounts]);

  const value = useMemo(() => ({ counts, loading, error, refreshCounts }), [counts, loading, error, refreshCounts]);

  return <CountsContext.Provider value={value}>{children}</CountsContext.Provider>;
}

export function useCounts() {
  const ctx = useContext(CountsContext);
  if (!ctx) throw new Error('useCounts must be used within a CountsProvider');
  return ctx;
}


