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

// Price formatting (robust against "$" and commas, and supports K/M/B suffixes)
export const parseNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const str = String(value).trim();

  // Match common currency strings like "$1,234,567.89" optionally with K/M/B
  const match = str.match(/^\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*([kKmMbB])?\s*$/);
  if (match) {
    let num = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(num)) return null;
    const suffix = (match[2] || '').toLowerCase();
    if (suffix === 'k') num *= 1_000;
    if (suffix === 'm') num *= 1_000_000;
    if (suffix === 'b') num *= 1_000_000_000;
    return num;
  }

  // Fallback: strip non-numeric (keep minus and dot)
  const sanitized = str.replace(/[^0-9.-]/g, '');
  const num = Number(sanitized);
  return Number.isFinite(num) ? num : null;
};

export const formatPrice = (price) => {
  const numPrice = parseNumericValue(price);
  if (numPrice === null) {
    // If we cannot parse, return the original value as string to avoid showing "$NaN"
    return String(price || '');
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  } catch (error) {
    console.warn('Failed to format price:', error);
    return String(price || '');
  }
};

// Compute price per square foot (derived on client when backend omits it)
export const computePricePerFt = (price, squareFeet) => {
  const priceNum = parseNumericValue(price);
  const sqftNum = parseNumericValue(squareFeet);
  if (!Number.isFinite(priceNum) || !Number.isFinite(sqftNum) || sqftNum <= 0) {
    return null;
  }
  const raw = priceNum / sqftNum;
  return Number.isFinite(raw) ? Number(raw.toFixed(2)) : null;
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

// State helpers
export const normalizeStateCode = (value) => {
  if (!value) return '';
  const onlyLetters = String(value).replace(/[^a-z]/gi, '');
  const code = onlyLetters.slice(0, 2).toUpperCase();
  return code;
};

export const getStateColor = (stateCode) => {
  if (!stateCode) return '#666';
  const code = normalizeStateCode(stateCode);
  // Simple deterministic hash to hue
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = ((hash << 5) - hash) + code.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  const hue = Math.abs(hash) % 360;
  // High saturation, mid lightness for contrast with white text
  return `hsl(${hue}, 65%, 42%)`;
};