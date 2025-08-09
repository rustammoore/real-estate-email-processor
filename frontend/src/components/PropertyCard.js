import React, { useState } from 'react';
import { 
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './ui/StatusBadge';
import PropertyActions from './ui/PropertyActions';
import FollowUpBadge from './ui/FollowUpBadge';
import FollowUpActions from './ui/FollowUpActions';
import { parseImages, formatDate, formatPrice } from '../utils';
import { UI_CONSTANTS } from '../constants';

function PropertyCard({ 
  property, 
  variant = 'default', 
  showActions = true, 
  onDelete = null,
  compact = false,
  customActions = null,
  onPropertyUpdate = null,
  showFollowUpBadge = false,
  onFollowUpRemoved = null,
  onFollowUpSet = null,
  onUpdate = null
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // Parse images using centralized utility
  const images = parseImages(property.images);

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(property.id);
    } else {
      // Fallback for when no onDelete handler is provided
      if (window.confirm('Are you sure you want to delete this property?')) {
        setIsDeleting(true);
        // Note: This fallback should ideally be handled by the parent component
        // For now, we'll just show an error message
        console.warn('No delete handler provided for PropertyCard');
        setIsDeleting(false);
      }
    }
  };

  const cardHeight = compact ? 'auto' : '100%';
  const imageHeight = compact ? UI_CONSTANTS.COMPACT_CARD_HEIGHT : UI_CONSTANTS.DEFAULT_CARD_HEIGHT;
  const descriptionLength = compact ? UI_CONSTANTS.COMPACT_DESCRIPTION_LENGTH : UI_CONSTANTS.DEFAULT_DESCRIPTION_LENGTH;

  return (
    <div 
      className={`
        ${cardHeight === 'auto' ? 'h-auto' : 'h-full'} 
        flex flex-col
        transition-all duration-200 ease-in-out
        hover:-translate-y-0.5 hover:shadow-lg
        ${variant === 'outlined' ? 'border border-gray-200' : 'shadow-md'}
        bg-white rounded-lg
        relative overflow-visible
      `}
    >
      {/* Deleted Ribbon */}
      {property.deleted && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-2xs font-bold px-2 py-0.5 rounded">
          DELETED
        </div>
      )}
      {/* Property Image */}
      {images && images.length > 0 ? (
        <img
          className="w-full object-cover rounded-t-lg"
          style={{ height: imageHeight }}
          src={images[0]}
          alt={property.title}
        />
      ) : (
        <div
          className="w-full bg-gray-200 flex items-center justify-center rounded-t-lg"
          style={{ height: imageHeight }}
        >
          <BuildingOfficeIcon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-gray-400`} />
        </div>
      )}

      {/* Follow-up Badge */}
      {showFollowUpBadge && property.followUpDate && (
        <FollowUpBadge followUpDate={property.followUpDate} />
      )}

      {/* Card Content */}
      <div className={`flex-grow p-${compact ? '3' : '4'}`}>
        <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-medium mb-2 truncate`}>
          {property.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 leading-5">
          {property.description?.substring(0, descriptionLength)}
          {property.description?.length > descriptionLength && '...'}
        </p>
        
        {/* Status Badge */}
        <div className="mb-3">
          <StatusBadge status={property.status} />
        </div>

        {/* Property Details */}
        <div className="mb-2">
          {property.location && (
            <p className="text-xs text-gray-500 mb-1">
              📍 {property.location}
            </p>
          )}
          {property.price && (
            <p className="text-xs text-gray-500 mb-1">
              💰 {formatPrice(property.price)}
            </p>
          )}
          {property.bedrooms && property.bathrooms && (
            <p className="text-xs text-gray-500 mb-1">
              🏠 {property.bedrooms} bed, {property.bathrooms} bath
            </p>
          )}
        </div>

        {/* Email Source & Date */}
        <p className="text-xs text-gray-500 mb-1">
          📧 {property.email_source}
        </p>
        <p className="text-xs text-gray-500">
          📅 {formatDate(property.createdAt)}
        </p>
      </div>

      {/* Action Buttons */}
      {showActions && customActions ? (
        <div className={`${compact ? 'p-2' : 'p-4'} pt-0 border-t border-gray-200`}>
          {customActions}
        </div>
      ) : showActions ? (
        <div className={`${compact ? 'p-2' : 'p-4'} pt-0 border-t border-gray-200`}>
          <div className="flex justify-center items-center w-full gap-2 flex-wrap">
            {/* View Details Button */}
            <button
              onClick={() => navigate(`/properties/${property.id}`)}
              title="View Details"
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            
            {/* Edit Button */}
            <button
              onClick={() => navigate(`/properties/${property.id}?edit=1`)}
              title="Edit Property"
              className="w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center justify-center transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            
            {/* Follow-up Actions */}
            <FollowUpActions
              property={property}
              onUpdate={onUpdate || onPropertyUpdate}
              onFollowUpSet={onFollowUpSet}
              onFollowUpRemoved={onFollowUpRemoved}
            />
            
            {/* Property Actions (Like, Love, Rating, Archive) */}
            <PropertyActions 
              property={property} 
              onUpdate={onPropertyUpdate}
            />
            
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title={isDeleting ? "Deleting..." : "Delete Property"}
              className={`w-8 h-8 ${isDeleting ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} text-white rounded-md flex items-center justify-center transition-colors disabled:cursor-not-allowed`}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`${compact ? 'p-2' : 'p-4'} pt-0 border-t border-gray-200`}>
          <button
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => navigate(`/properties/${property.id}`)}
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
}

export default PropertyCard; 