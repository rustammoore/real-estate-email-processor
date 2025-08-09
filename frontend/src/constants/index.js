// Status configurations
export const PROPERTY_STATUSES = {
  ACTIVE: 'active',
  SOLD: 'sold',
  PENDING: 'pending',
  DELETED: 'deleted'
};

export const STATUS_CONFIG = {
  [PROPERTY_STATUSES.ACTIVE]: {
    label: 'Active',
    color: 'success',
    icon: '🏠'
  },
  [PROPERTY_STATUSES.SOLD]: {
    label: 'Sold',
    color: 'error',
    icon: '✅'
  },
  [PROPERTY_STATUSES.PENDING]: {
    label: 'Pending Review',
    color: 'warning',
    icon: '🔍'
  },
  [PROPERTY_STATUSES.DELETED]: {
    label: 'Deleted',
    color: 'error',
    icon: '🗑️'
  }
};

// API endpoints
export const API_ENDPOINTS = {
  PROPERTIES: '/properties',
  PROCESS_EMAILS: '/process-emails',
  PENDING_REVIEW: '/properties/pending-review',
  DELETED: '/properties/deleted'
};

// UI constants
export const UI_CONSTANTS = {
  COMPACT_CARD_HEIGHT: 140,
  DEFAULT_CARD_HEIGHT: 200,
  COMPACT_DESCRIPTION_LENGTH: 80,
  DEFAULT_DESCRIPTION_LENGTH: 100,
  MAX_BADGE_COUNT: 99
};

// Validation schemas
export const VALIDATION_SCHEMAS = {
  PROPERTY: {
    title: { required: true, minLength: 3, maxLength: 100 },
    description: { required: true, minLength: 10, maxLength: 500 },
    price: { required: true, pattern: /^\d+(\.\d{1,2})?$/ },
    location: { required: true, minLength: 5 },
    bedrooms: { required: true, min: 0, max: 20 },
    bathrooms: { required: true, min: 0, max: 10 }
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  GENERIC: 'Something went wrong. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  PROPERTY_CREATED: 'Property created successfully!',
  PROPERTY_UPDATED: 'Property updated successfully!',
  PROPERTY_DELETED: 'Property deleted successfully!',
  PROPERTY_RESTORED: 'Property restored successfully!',
  DUPLICATE_APPROVED: 'Duplicate property approved!',
  DUPLICATE_REJECTED: 'Duplicate property rejected!',
  EMAILS_PROCESSED: 'Emails processed successfully!'
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  FILTER_STATE: 'filter_state',
  THEME: 'theme'
};

// Property interaction types
export const INTERACTION_TYPES = {
  LIKE: 'like',
  LOVE: 'love',
  RATING: 'rating',
  ARCHIVE: 'archive'
};

// Interaction configuration with colors, icons, and labels
export const INTERACTION_CONFIG = {
  [INTERACTION_TYPES.LIKE]: {
    label: 'Like',
    activeLabel: 'Liked',
    color: 'primary',
    activeIcon: 'ThumbUpIcon',
    inactiveIcon: 'ThumbUpOutlinedIcon',
    tooltip: {
      active: 'Unlike',
      inactive: 'Like'
    }
  },
  [INTERACTION_TYPES.LOVE]: {
    label: 'Love',
    activeLabel: 'Loved',
    color: 'error',
    activeIcon: 'FavoriteIcon',
    inactiveIcon: 'FavoriteBorderIcon',
    tooltip: {
      active: 'Unlove',
      inactive: 'Love'
    }
  },
  [INTERACTION_TYPES.RATING]: {
    label: 'Rating',
    activeLabel: 'Rated',
    color: 'warning',
    activeIcon: 'StarIcon',
    inactiveIcon: 'StarBorderIcon',
    tooltip: {
      active: 'Change Rating',
      inactive: 'Add Rating'
    }
  },
  [INTERACTION_TYPES.ARCHIVE]: {
    label: 'Archive',
    activeLabel: 'Archived',
    color: 'warning',
    activeIcon: 'ArchiveIcon',
    inactiveIcon: 'ArchiveOutlinedIcon',
    tooltip: {
      active: 'Unarchive',
      inactive: 'Archive'
    }
  }
};

// Rating configuration
export const RATING_CONFIG = {
  MIN: 0,
  MAX: 10,
  LABELS: {
    0: 'No Rating',
    1: 'Poor',
    2: 'Poor',
    3: 'Poor',
    4: 'Fair',
    5: 'Fair',
    6: 'Good',
    7: 'Good',
    8: 'Very Good',
    9: 'Very Good',
    10: 'Excellent'
  },
  COLORS: {
    0: '#ccc', // Gray
    1: '#ff6347', // Tomato
    2: '#ff6347', // Tomato
    3: '#ff6347', // Tomato
    4: '#ffa500', // Orange
    5: '#ffa500', // Orange
    6: '#ffa500', // Orange
    7: '#ffa500', // Orange
    8: '#ffd700', // Gold
    9: '#ffd700', // Gold
    10: '#ffd700' // Gold
  }
}; 