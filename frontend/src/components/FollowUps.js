import React, { useState, useEffect } from 'react';
import PropertyGrid from './PropertyGrid';
import LoadingSpinner from './ui/LoadingSpinner';
import Toast from './ui/Toast';
import { useSearch } from '../contexts/SearchContext';
import api from '../services/api';
import '../styles/FollowUps.css';
import { Box, FormControlLabel, Switch } from '@mui/material';
import SearchFilter from './ui/SearchFilter';
import BackButton from './ui/BackButton';

const FollowUps = () => {
  const [loading, setLoading] = useState(true);
  const [allFollowUps, setAllFollowUps] = useState([]);
  const [followUpsDue, setFollowUpsDue] = useState([]);
  const [followUpsNotDue, setFollowUpsNotDue] = useState([]);
  const [counts, setCounts] = useState({ due: 0, notDue: 0, total: 0 });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { updateDynamicFields, filterProperties } = useSearch();

  // Toggles: default shows only regular (non-archived, non-deleted)
  const [showRegular, setShowRegular] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const loadFollowUps = async () => {
    try {
      // Avoid full-page spinner on refreshes after initial load
      setLoading(allFollowUps.length === 0);
      setError(null);
      // Fetch non-deleted and deleted to support toggles
      const [normalProps, deletedProps] = await Promise.all([
        api.getProperties({ page: 1, limit: 1000 }),
        api.getDeletedProperties()
      ]);

      const combined = [...(normalProps || []), ...(deletedProps || [])];
      const withFollowUps = combined.filter((p) => Boolean(p.followUpDate));
      setAllFollowUps(withFollowUps);
    } catch (err) {
      console.error('Error loading follow-ups:', err);
      setError('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, []);

  useEffect(() => {
    // Recompute sections whenever toggles or source change
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const isDue = (p) => new Date(p.followUpDate) <= endOfToday;
    const isUpcoming = (p) => new Date(p.followUpDate) > endOfToday;
    const isRegular = (p) => !p.archived && !p.deleted;
    const isArchived = (p) => p.archived && !p.deleted;
    const isDeleted = (p) => p.deleted;

    const selected = (allFollowUps || []).filter((p) =>
      (showRegular && isRegular(p)) || (showArchived && isArchived(p)) || (showDeleted && isDeleted(p))
    );

    const due = selected.filter(isDue);
    const upcoming = selected.filter(isUpcoming);

    setFollowUpsDue(due);
    setFollowUpsNotDue(upcoming);
    setCounts({ due: due.length, notDue: upcoming.length, total: selected.length });

    if (selected.length > 0) {
      updateDynamicFields(selected);
    }

    // Persist counts and filters for global consumers (e.g., header badge)
    try {
      const countsPayload = { due: due.length, notDue: upcoming.length, total: selected.length };
      const filtersPayload = { showRegular, showArchived, showDeleted };
      sessionStorage.setItem('followUpCounts', JSON.stringify(countsPayload));
      sessionStorage.setItem('followUpFilters', JSON.stringify(filtersPayload));
      window.dispatchEvent(
        new CustomEvent('followUpCountsChanged', { detail: { counts: countsPayload, filters: filtersPayload } })
      );
    } catch (_) {
      // ignore storage issues
    }
  }, [allFollowUps, showRegular, showArchived, showDeleted, updateDynamicFields]);

  const handlePropertyUpdate = () => {
    loadFollowUps();
  };

  const handleFollowUpRemoved = (propertyId) => {
    setSuccessMessage('Follow-up removed');
    loadFollowUps();
  };

  // Only block the page with a spinner on the initial load
  if (loading && allFollowUps.length === 0) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredDue = filterProperties(followUpsDue);
  const filteredNotDue = filterProperties(followUpsNotDue);

  return (
    <div className="follow-ups-container">
      <div style={{ marginBottom: 8 }}>
        <BackButton />
      </div>
      <div className="follow-ups-header">
        <h1>Property Follow-ups</h1>
        <div className="follow-up-stats">
          <span className="stat-item">
            <span className="stat-label">Due:</span>
            <span className="stat-value due">{counts.due}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Upcoming:</span>
            <span className="stat-value upcoming">{counts.notDue}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{counts.total}</span>
          </span>
        </div>
      </div>

      {/* Global Search & Filters */}
      <SearchFilter properties={allFollowUps} showAdvanced={true} />

      {/* Toggle Row */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <FormControlLabel
          control={<Switch size="small" checked={showRegular} onChange={(e) => setShowRegular(e.target.checked)} />}
          label="Show Regular"
        />
        <FormControlLabel
          control={<Switch size="small" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />}
          label="Show Archived"
        />
        <FormControlLabel
          control={<Switch size="small" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
          label="Show Deleted"
        />
      </Box>

      {/* Follow-ups Due Section */}
      <div className="follow-up-section">
        <h2 className="section-title due-title">
          Follow-ups Due ({filteredDue.length})
        </h2>
        {filteredDue.length === 0 ? (
          <div className="empty-state">
            <p>No follow-ups are currently due</p>
          </div>
        ) : (
          <PropertyGrid
            properties={filteredDue}
            onPropertyUpdate={handlePropertyUpdate}
            showFollowUpBadge={true}
            onFollowUpRemoved={handleFollowUpRemoved}
            onUpdate={handlePropertyUpdate}
            variant="outlined"
          />
        )}
      </div>

      {/* Follow-ups Not Due Section */}
      <div className="follow-up-section">
        <h2 className="section-title upcoming-title">
          Upcoming Follow-ups ({counts.notDue})
        </h2>
        {filteredNotDue.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming follow-ups scheduled</p>
          </div>
        ) : (
          <PropertyGrid
            properties={filteredNotDue}
            onPropertyUpdate={handlePropertyUpdate}
            showFollowUpBadge={true}
            onFollowUpRemoved={handleFollowUpRemoved}
            onUpdate={handlePropertyUpdate}
            variant="outlined"
          />
        )}
      </div>

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage('')}
        />
      )}
    </div>
  );
};

export default FollowUps;