import React, { useState, useEffect } from 'react';
import PropertyCard from './PropertyCard';
import PropertyGrid from './PropertyGrid';
import LoadingSpinner from './ui/LoadingSpinner';
import Toast from './ui/Toast';
import { useSearch } from '../contexts/SearchContext';
import api from '../services/api';
import '../styles/FollowUps.css';

const FollowUps = () => {
  const [loading, setLoading] = useState(true);
  const [followUpsDue, setFollowUpsDue] = useState([]);
  const [followUpsNotDue, setFollowUpsNotDue] = useState([]);
  const [counts, setCounts] = useState({ due: 0, notDue: 0, total: 0 });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { searchQuery, filterProperties } = useSearch();

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchFollowUps();
      setFollowUpsDue(data.followUpsDue || []);
      setFollowUpsNotDue(data.followUpsNotDue || []);
      setCounts(data.counts || { due: 0, notDue: 0, total: 0 });
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

  const handlePropertyUpdate = () => {
    loadFollowUps();
  };

  const handleFollowUpRemoved = (propertyId) => {
    setSuccessMessage('Follow-up removed');
    loadFollowUps();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredDue = filterProperties(followUpsDue);
  const filteredNotDue = filterProperties(followUpsNotDue);

  return (
    <div className="follow-ups-container">
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
          />
        )}
      </div>

      {/* Follow-ups Not Due Section */}
      <div className="follow-up-section">
        <h2 className="section-title upcoming-title">
          Upcoming Follow-ups ({filteredNotDue.length})
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