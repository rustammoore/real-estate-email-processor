import { ERROR_MESSAGES } from '../constants';

// Image parsing utilities
export const parseImages = (images) => {
  if (!images) return [];
  
  try {
    if (typeof images === 'string') {
      return JSON.parse(images);
    } else if (Array.isArray(images)) {
      // Handle case where images array contains a JSON string
      if (images.length === 1 && typeof images[0] === 'string' && images[0].startsWith('[')) {
        return JSON.parse(images[0]);
      }
      return images;
    }
    return [];
  } catch (error) {
    console.warn('Failed to parse images:', error);
    return [];
  }
};

// Date formatting utilities
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    return new Date(dateString).toLocaleDateString(undefined, defaultOptions);
  } catch (error) {
    console.warn('Failed to format date:', error);
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Price formatting
export const formatPrice = (price) => {
  if (!price) return '';
  
  try {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  } catch (error) {
    console.warn('Failed to format price:', error);
    return price;
  }
};

// Validation utilities
export const validateField = (value, rules) => {
  if (rules.required && (!value || value.trim() === '')) {
    return 'This field is required';
  }
  
  if (value) {
    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`;
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`;
    }
    
    if (rules.min && parseFloat(value) < rules.min) {
      return `Minimum value is ${rules.min}`;
    }
    
    if (rules.max && parseFloat(value) > rules.max) {
      return `Maximum value is ${rules.max}`;
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.patternMessage || 'Invalid format';
    }
  }
  
  return null;
};

export const validateForm = (data, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const error = validateField(data[field], schema[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Error handling utilities
export const getErrorMessage = (error) => {
  if (!error) return ERROR_MESSAGES.GENERIC;
  
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 400:
        return error.response.data?.error || ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return error.response.data?.error || ERROR_MESSAGES.GENERIC;
    }
  }
  
  if (error.request) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  return error.message || ERROR_MESSAGES.GENERIC;
};

// Local storage utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to get from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to set localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Property interaction utilities
export const getRatingColor = (rating) => {
  if (rating >= 8) return '#ffd700'; // Gold
  if (rating >= 6) return '#ffa500'; // Orange
  if (rating >= 4) return '#ff6347'; // Tomato
  return '#ccc'; // Gray
};

export const getRatingLabel = (rating) => {
  if (rating <= 3) return 'Poor';
  if (rating <= 5) return 'Fair';
  if (rating <= 7) return 'Good';
  if (rating <= 9) return 'Very Good';
  if (rating === 10) return 'Excellent';
  return 'No Rating';
}; 