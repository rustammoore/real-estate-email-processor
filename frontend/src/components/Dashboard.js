import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  ArrowPathIcon,
  ClockIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import PropertyGrid from './PropertyGrid';
import SearchFilter from './ui/SearchFilter';
import api from '../services/api';
import { useSearch } from '../contexts/SearchContext';
import { useCounts } from '../contexts/CountsContext';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    pendingReviewCount: 0,
    deletedPropertiesCount: 0,
    recentProperties: []
  });
  const [allProperties, setAllProperties] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { filterProperties, searchState, updateDynamicFields } = useSearch();
  const { counts } = useCounts();

  const sortPropertiesByRecentChange = (props = []) => {
    return props
      .slice()
      .sort((a, b) => {
        const bTime = new Date(b.updatedAt || b.createdAt).getTime();
        const aTime = new Date(a.updatedAt || a.createdAt).getTime();
        return bTime - aTime;
      });
  };

  const getRecentTop10 = (props = []) => sortPropertiesByRecentChange(props).slice(0, 10);

  useEffect(() => {
    fetchStats();
  }, []);

  // Global listeners to reflect changes made from other pages (e.g., detail view)
  useEffect(() => {
    const onPropertyUpdated = (e) => {
      const updated = e.detail;
      if (!updated?.id) return;
      setAllProperties(prev => {
        const updatedAll = prev.some(p => p.id === updated.id)
          ? prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p))
          : [updated, ...prev];
        setStats(prevStats => ({
          ...prevStats,
          recentProperties: getRecentTop10(updatedAll)
        }));
        return updatedAll;
      });
    };

    const onPropertyDeleted = (e) => {
      const { id } = e.detail || {};
      if (!id) return;
      setAllProperties(prev => {
        const updatedAll = prev.filter(p => p.id !== id);
        setStats(prevStats => ({
          ...prevStats,
          totalProperties: Math.max(prevStats.totalProperties - 1, 0),
          deletedPropertiesCount: prevStats.deletedPropertiesCount + 1,
          recentProperties: getRecentTop10(updatedAll)
        }));
        return updatedAll;
      });
    };

    window.addEventListener('property:updated', onPropertyUpdated);
    window.addEventListener('property:deleted', onPropertyDeleted);
    return () => {
      window.removeEventListener('property:updated', onPropertyUpdated);
      window.removeEventListener('property:deleted', onPropertyDeleted);
    };
  }, []);

  useEffect(() => {
    // Keep dynamic fields updated from latest full property set
    if (allProperties && allProperties.length > 0) {
      updateDynamicFields(allProperties);
    }
  }, [allProperties, updateDynamicFields]);

  const fetchStats = async () => {
    try {
      const properties = await api.getProperties();
      const activeProperties = properties.filter(p => p.status === 'active');
      
      // Determine most recently changed properties by updatedAt (fallback to createdAt)
      const recentProperties = getRecentTop10(properties);

      setStats({
        totalProperties: properties.length,
        activeProperties: activeProperties.length,
        pendingReviewCount: 0,
        deletedPropertiesCount: 0,
        recentProperties
      });
      setAllProperties(properties);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.deleteProperty(propertyId);
        setMessage('Property deleted successfully!');
        fetchStats(); // Refresh stats
      } catch (error) {
        setMessage('Error deleting property: ' + error.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 mb-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Dashboard
      </h1>

      {message && (
        <div className={`p-4 mb-4 rounded-md ${
          message.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center">
            <BuildingOfficeIcon className="w-4 h-4 text-blue-500 mr-2" />
            <div>
              <div className="text-lg font-semibold text-gray-900 leading-tight">
                {stats.totalProperties}
              </div>
              <div className="text-[10px] text-gray-500">
                Total Properties
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center">
            <BuildingOfficeIcon className="w-4 h-4 text-green-500 mr-2" />
            <div>
              <div className="text-lg font-semibold text-gray-900 leading-tight">
                {stats.activeProperties}
              </div>
              <div className="text-[10px] text-gray-500">
                Active Properties
              </div>
            </div>
          </div>
        </div>

        {/* Follow Ups */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 text-indigo-500 mr-2" />
            <div>
              <div className="text-lg font-semibold text-gray-900 leading-tight">
                {counts?.followUps?.total || 0}
              </div>
              <div className="text-[10px] text-gray-500">
                Follow Ups
              </div>
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 text-yellow-500 mr-2" />
            <div>
              <div className="text-lg font-semibold text-gray-900 leading-tight">
                {counts?.pendingReview || 0}
              </div>
              <div className="text-[10px] text-gray-500">
                Pending Review
              </div>
            </div>
          </div>
        </div>

        {/* Archived */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center">
            <ArchiveBoxIcon className="w-4 h-4 text-gray-700 mr-2" />
            <div>
              <div className="text-lg font-semibold text-gray-900 leading-tight">
                {counts?.archived || 0}
              </div>
              <div className="text-[10px] text-gray-500">
                Archived
              </div>
            </div>
          </div>
        </div>

        {/* Deleted */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center">
            <BuildingOfficeIcon className="w-4 h-4 text-red-500 mr-2" />
            <div>
              <div className="text-lg font-semibold text-gray-900 leading-tight">
                {counts?.deleted || 0}
              </div>
              <div className="text-[10px] text-gray-500">
                Deleted Properties
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Section with Search */}
      <div className="bg-white rounded-lg shadow-md mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {searchState.searchTerm || Object.keys(searchState.filters).length > 0 
              ? 'Search Results' 
              : 'Recent Properties'}
          </h2>
          <div className="flex gap-2">
            {(searchState.searchTerm || Object.keys(searchState.filters).length > 0) && (
              <button
                onClick={() => navigate('/properties')}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                View All Results
              </button>
            )}
            <button
              onClick={fetchStats}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Search Filter (full with advanced filters) */}
        <SearchFilter 
          properties={allProperties}
          showAdvanced={true}
        />
        
        {/* Property Grid */}
        <PropertyGrid 
          properties={
            searchState.searchTerm || Object.keys(searchState.filters).length > 0
              ? filterProperties(allProperties).slice(0, 10) // Show max 10 results on dashboard
              : stats.recentProperties
          }
          emptyMessage={
            searchState.searchTerm || Object.keys(searchState.filters).length > 0
              ? "No properties found matching your search"
              : "No recent properties found"
          }
          compact={true}
          variant="outlined"
          onDelete={handleDelete}
          showFollowUpBadge={true}
          onFollowUpSet={(propertyId, days) => {
            // Update the property in both lists and re-sort recent list
            const existing = allProperties.find(p => p.id === propertyId);
            if (existing) {
              const followUpDate = new Date();
              followUpDate.setDate(followUpDate.getDate() + days);
              const updatedProperty = { 
                ...existing, 
                followUpDate: followUpDate.toISOString(),
                updatedAt: new Date().toISOString()
              };

              setAllProperties(prev => {
                const updatedAll = prev.map(p => (p.id === propertyId ? updatedProperty : p));
                setStats(prevStats => ({
                  ...prevStats,
                  recentProperties: getRecentTop10(updatedAll)
                }));
                return updatedAll;
              });
            }
          }}
          onFollowUpRemoved={(propertyId) => {
            // Update the property in both lists and re-sort recent list
            const existing = allProperties.find(p => p.id === propertyId);
            if (existing) {
              const updatedProperty = { 
                ...existing, 
                followUpDate: null,
                updatedAt: new Date().toISOString()
              };

              setAllProperties(prev => {
                const updatedAll = prev.map(p => (p.id === propertyId ? updatedProperty : p));
                setStats(prevStats => ({
                  ...prevStats,
                  recentProperties: getRecentTop10(updatedAll)
                }));
                return updatedAll;
              });
            }
          }}
          onPropertyUpdate={(updatedProperty) => {
            // Update the property in both lists and re-sort recent list
            setAllProperties(prev => {
              const updatedAll = prev.map(p => (p.id === updatedProperty.id ? updatedProperty : p));
              setStats(prevStats => ({
                ...prevStats,
                recentProperties: getRecentTop10(updatedAll)
              }));
              return updatedAll;
            });
          }}
          onUpdate={() => {
            fetchStats();
          }}
        />
        
        {/* Show more results message */}
        {(searchState.searchTerm || Object.keys(searchState.filters).length > 0) && 
          filterProperties(allProperties).length > 10 && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Showing 10 of {filterProperties(allProperties).length} results
              </p>
              <button 
                onClick={() => navigate('/properties')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                View All Results
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

export default Dashboard; 