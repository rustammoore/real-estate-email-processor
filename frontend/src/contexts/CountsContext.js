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

      const [allProps, pendingAll, archivedResp, deletedList] = await Promise.all([
        api.getProperties({ page: 1, limit: 1000 }),
        api.getPendingReviewProperties(),
        api.getArchivedPropertiesCount(),
        api.getDeletedProperties(),
      ]);

      // Compute follow-ups from a consistent global definition: non-archived, non-deleted
      const now = new Date();
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      const isRegular = (p) => !p.archived && !p.deleted;
      const withFollowUps = (Array.isArray(allProps) ? allProps : []).filter(
        (p) => isRegular(p) && Boolean(p.followUpDate)
      );
      const due = withFollowUps.filter((p) => new Date(p.followUpDate) <= endOfToday);
      const notDue = withFollowUps.filter((p) => new Date(p.followUpDate) > endOfToday);

      // For header/menu: pending review count excludes deleted by default
      const pendingVisible = Array.isArray(pendingAll) ? pendingAll.filter((p) => !p.deleted) : [];

      setCounts({
        followUps: { due: due.length, notDue: notDue.length, total: withFollowUps.length },
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


