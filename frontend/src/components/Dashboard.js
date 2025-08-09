import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import PropertyGrid from './PropertyGrid';
import SearchFilter from './ui/SearchFilter';
import api from '../services/api';
import { useSearch } from '../contexts/SearchContext';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    pendingReviewCount: 0,
    deletedPropertiesCount: 0,
    recentProperties: []
  });
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAllProperties, setShowAllProperties] = useState(false);
  const navigate = useNavigate();
  const { filterProperties, searchState, updateDynamicFields } = useSearch();

  useEffect(() => {
    fetchStats();
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
      
      // Get pending review count
      let pendingReviewCount = 0;
      try {
        const pendingProperties = await api.getPendingReviewProperties();
        pendingReviewCount = pendingProperties.length;
      } catch (error) {
        console.error('Error fetching pending review count:', error);
      }
      
      // Get deleted properties count
      let deletedPropertiesCount = 0;
      try {
        const deletedProperties = await api.getDeletedProperties();
        deletedPropertiesCount = deletedProperties.length;
      } catch (error) {
        console.error('Error fetching deleted properties count:', error);
      }
      
      setStats({
        totalProperties: properties.length,
        activeProperties: activeProperties.length,
        pendingReviewCount,
        deletedPropertiesCount,
        recentProperties: properties.slice(0, 5)
      });
      setAllProperties(properties);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProcessEmails = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await api.processEmails();
      setMessage('Emails processed successfully!');
      fetchStats(); // Refresh stats
    } catch (error) {
      setMessage('Error processing emails: ' + error.message);
    } finally {
      setLoading(false);
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

  const handleRecheckDuplicates = async () => {
    if (window.confirm('This will re-check all active properties for duplicates. Properties detected as duplicates will be moved to pending review. Continue?')) {
      setLoading(true);
      setMessage('');
      
      try {
        const result = await api.recheckDuplicates();
        setMessage(result.message);
        fetchStats(); // Refresh stats
      } catch (error) {
        setMessage('Error rechecking duplicates: ' + error.message);
      } finally {
        setLoading(false);
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalProperties}
              </div>
              <div className="text-xs text-gray-500">
                Total Properties
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <BuildingOfficeIcon className="w-5 h-5 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.activeProperties}
              </div>
              <div className="text-xs text-gray-500">
                Active Properties
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <ClockIcon className="w-5 h-5 text-yellow-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.pendingReviewCount}
              </div>
              <div className="text-xs text-gray-500">
                Pending Review
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <BuildingOfficeIcon className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.deletedPropertiesCount}
              </div>
              <div className="text-xs text-gray-500">
                Deleted Properties
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <button
            onClick={handleProcessEmails}
            disabled={loading}
            className="w-full h-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <EnvelopeIcon className="w-4 h-4" />
            {loading ? 'Processing...' : 'Process Emails'}
          </button>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <button
            onClick={() => navigate('/pending-review')}
            className="w-full h-20 border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-md flex items-center justify-center gap-2 transition-all font-medium"
          >
            <ClockIcon className="w-5 h-5" />
            Review Duplicates
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <button
            onClick={() => navigate('/deleted-properties')}
            className="w-full h-20 border border-gray-300 hover:border-red-500 hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-md flex items-center justify-center gap-2 transition-all font-medium"
          >
            <BuildingOfficeIcon className="w-5 h-5" />
            View Deleted
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <button
            onClick={handleRecheckDuplicates}
            disabled={loading}
            className="w-full h-20 border border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 hover:text-green-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded-md flex items-center justify-center gap-2 transition-all font-medium"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Recheck Duplicates
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <button
            onClick={() => setShowAllProperties(!showAllProperties)}
            className="w-full h-20 border border-gray-300 hover:border-purple-500 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-md flex items-center justify-center gap-2 transition-all font-medium"
          >
            <DocumentMagnifyingGlassIcon className="w-5 h-5" />
            {showAllProperties ? 'Hide' : 'Show'} All Properties
          </button>
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
        
        {/* Search Filter */}
        <SearchFilter 
          properties={allProperties} 
          variant="compact" 
          showAdvanced={false} 
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
            // Update the property in both lists
            const updatedProperty = { ...allProperties.find(p => p.id === propertyId) };
            if (updatedProperty) {
              const followUpDate = new Date();
              followUpDate.setDate(followUpDate.getDate() + days);
              updatedProperty.followUpDate = followUpDate.toISOString();
              
              setStats(prevStats => ({
                ...prevStats,
                recentProperties: prevStats.recentProperties.map(p => 
                  p.id === propertyId ? updatedProperty : p
                )
              }));
              setAllProperties(prev => prev.map(p => 
                p.id === propertyId ? updatedProperty : p
              ));
            }
          }}
          onFollowUpRemoved={(propertyId) => {
            // Update the property in both lists
            const updatedProperty = { ...allProperties.find(p => p.id === propertyId) };
            if (updatedProperty) {
              updatedProperty.followUpDate = null;
              
              setStats(prevStats => ({
                ...prevStats,
                recentProperties: prevStats.recentProperties.map(p => 
                  p.id === propertyId ? updatedProperty : p
                )
              }));
              setAllProperties(prev => prev.map(p => 
                p.id === propertyId ? updatedProperty : p
              ));
            }
          }}
          onPropertyUpdate={(updatedProperty) => {
            // Update the property in both lists
            setStats(prevStats => ({
              ...prevStats,
              recentProperties: prevStats.recentProperties.map(p => 
                p.id === updatedProperty.id ? updatedProperty : p
              )
            }));
            setAllProperties(prev => prev.map(p => 
              p.id === updatedProperty.id ? updatedProperty : p
            ));
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