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
import { parseImages, formatDate, formatPrice, computePricePerFt, getStateColor } from '../utils';
import { UI_CONSTANTS } from '../constants';
import ConfirmationDialog from './ui/ConfirmationDialog';
import { useToast } from '../contexts/ToastContext';

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
  onUpdate = null,
  // Selection mode props for bulk actions
  selectMode = false,
  isSelected = false,
  onSelectToggle = null
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Parse images using centralized utility
  const images = parseImages(property.images);

  const handleDelete = () => {
    setConfirmOpen(true);
  };
  const handleCancelDelete = () => setConfirmOpen(false);
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete(property.id);
      }
      showSuccess('Property deleted', 'Success');
    } catch (err) {
      showError(err.message || 'Error deleting property', 'Error');
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  const cardHeight = compact ? 'auto' : '100%';
  const imageHeight = compact ? UI_CONSTANTS.COMPACT_CARD_HEIGHT : UI_CONSTANTS.DEFAULT_CARD_HEIGHT;
  const descriptionLength = compact ? UI_CONSTANTS.COMPACT_DESCRIPTION_LENGTH : UI_CONSTANTS.DEFAULT_DESCRIPTION_LENGTH;
  const pricePerFt = (() => {
    const serverValue = property.price_per_ft;
    if (Number.isFinite(serverValue) && serverValue > 0) return serverValue;
    const computed = computePricePerFt(property.price, property.square_feet);
    return Number.isFinite(computed) && computed > 0 ? computed : null;
  })();

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
      {/* Selection Checkbox (top-right) */}
      {selectMode && (
        <div className="absolute top-2 right-2 z-20">
          <input
            type="checkbox"
            checked={Boolean(isSelected)}
            onChange={(e) => {
              e.stopPropagation();
              if (onSelectToggle) onSelectToggle();
            }}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
            aria-label={isSelected ? 'Deselect property' : 'Select property'}
          />
        </div>
      )}
      {/* Status Badges (DELETED then ARCHIVED) */}
      {(property.deleted || property.archived) && (
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {property.deleted && (
            <div className="bg-red-600 text-white text-2xs font-bold px-2 py-0.5 rounded">
              DELETED
            </div>
          )}
          {property.archived && (
            <div className="bg-orange-500 text-white text-2xs font-bold px-2 py-0.5 rounded">
              ARCHIVED
            </div>
          )}
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
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-medium mb-1 leading-tight break-words`}>
          {property.property_url ? (
            <a
              href={property.property_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {property.title}
            </a>
          ) : (
            property.title
          )}
        </h3>

        {property.description && (
          <p className="text-xs text-gray-600 mb-2 leading-5">
            {property.description.substring(0, descriptionLength)}
            {property.description.length > descriptionLength && '...'}
          </p>
        )}
        
        {/* Structured Property Details */}
        <div className="mb-2 space-y-1">
          {(property.status || property.property_type || property.sub_type) && (
            <p className="text-xs text-gray-700 flex items-center flex-wrap gap-1">
              {property.status && <StatusBadge status={property.status} />}
              {(property.property_type || property.sub_type) && (
                <>
                  <span className="mx-1">|</span>
                  {property.property_type && <span>🏢 {property.property_type}</span>}
                  {property.sub_type && (
                    <>
                      {property.property_type && <span className="mx-1">|</span>}
                      <span>🏷️ {property.sub_type}</span>
                    </>
                  )}
                </>
              )}
            </p>
          )}
          {property.location && (
            <p className="text-xs text-gray-700">📍 {property.location}</p>
          )}
          {(property.price || property.cap_rate) && (
            <p className="text-xs text-gray-700">
              {[
                property.price ? `💰 ${formatPrice(property.price)}` : null,
                property.cap_rate ? `📈 ${String(property.cap_rate)}` : null,
              ].filter(Boolean).join(' | ')}
            </p>
          )}
          {(property.square_feet || pricePerFt) && (
            <p className="text-xs text-gray-700">
              {[
                property.square_feet ? `📐 ${property.square_feet} ft²` : null,
                pricePerFt ? `💵 $${Math.round(pricePerFt).toLocaleString()}/ft²` : null,
              ].filter(Boolean).join(' | ')}
            </p>
          )}
          {(property.acre || property.year_built) && (
            <p className="text-xs text-gray-700">
              {[
                property.acre ? `🌿 ${property.acre} acres` : null,
                property.year_built ? `🏗️ ${property.year_built}` : null,
              ].filter(Boolean).join(' | ')}
            </p>
          )}

          {property.email_source && (
            <p className="text-xs text-gray-700">📧 {property.email_source}</p>
          )}
          {(property.email_date || property.createdAt || property.state) && (
            <div className="text-xs text-gray-700 flex items-center justify-between">
              <span className="whitespace-nowrap">
                {property.email_date || property.createdAt ? (
                  <>📅 {formatDate(property.email_date || property.createdAt)}</>
                ) : (
                  <span />
                )}
              </span>
              {property.state && (
                <span
                  className="whitespace-nowrap px-2 py-0.5 rounded text-white font-bold text-sm"
                  style={{ backgroundColor: getStateColor(property.state) }}
                  title="State"
                >
                  {String(property.state).toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
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

      {/* Confirm Delete dialog for card */}
      <ConfirmationDialog
        open={confirmOpen}
        title="Delete Property"
        message="Are you sure you want to delete this property? This action can be undone from Deleted items."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}

export default PropertyCard; 