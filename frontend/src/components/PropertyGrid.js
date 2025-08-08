import React from 'react';
import PropertyCard from './PropertyCard';

function PropertyGrid({ 
  properties, 
  onDelete = null, 
  customActions = null,
  emptyMessage = "No properties found",
  loading = false,
  compact = false,
  variant = 'default',
  onPropertyUpdate = null,
  showFollowUpBadge = true,
  onFollowUpSet = null,
  onFollowUpRemoved = null,
  onUpdate = null
}) {
  if (loading) {
    return (
      <div className="text-center mt-8">
        <p className="text-gray-600">Loading properties...</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center mt-8">
        <h3 className="text-lg font-medium text-gray-500">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {properties.map((property) => (
        <PropertyCard 
          key={property.id}
          property={property}
          showActions={true}
          onDelete={onDelete}
          customActions={customActions ? customActions(property) : null}
          compact={compact}
          variant={variant}
          onPropertyUpdate={onPropertyUpdate}
          showFollowUpBadge={showFollowUpBadge}
          onFollowUpSet={onFollowUpSet}
          onFollowUpRemoved={onFollowUpRemoved}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

export default PropertyGrid; 