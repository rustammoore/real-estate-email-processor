import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { PROPERTY_FIELDS, PROPERTY_FIELDS_MAP } from '../constants/propertySchema';

const SearchContext = createContext();

// Robust numeric extractor for values that may include currency symbols, commas, or units
// Examples:
// "$15,000/month" -> 15000
// "5,000" -> 5000
// "1.25 acres" -> 1.25
function extractNumeric(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string') return NaN;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  // Guard against strings like ".." or "-" which parseFloat would return NaN for anyway
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

// Build metadata map from centralized schema
const SCHEMA_METADATA = (() => {
  const meta = { text: [], numeric: [], boolean: [], enum: {}, date: [], special: [], images: [] };
  PROPERTY_FIELDS.forEach((f) => {
    switch (f.type) {
      case 'text':
        meta.text.push(f.name);
        break;
      case 'numeric':
        meta.numeric.push(f.name);
        break;
      case 'boolean':
        meta.boolean.push(f.name);
        break;
      case 'enum':
        meta.enum[f.name] = f.options || [];
        break;
      case 'date':
        meta.date.push(f.name);
        break;
      case 'images':
        meta.images.push(f.name);
        break;
      default:
        meta.special.push(f.name);
    }
  });
  // Include common backend/system fields for search/sort if present in data
  ['createdAt', 'updatedAt'].forEach((k) => { if (!meta.date.includes(k)) meta.date.push(k); });
  return meta;
})();

const createDefaultState = () => ({
  searchTerm: '',
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  dynamicFields: new Set(),
  groupBy: null, // { field: string, order: 'asc'|'desc' }
});

export const SearchProvider = ({ children }) => {
  // Store search state per page key; 'default' holds global fallback
  const [searchStates, setSearchStates] = useState({ default: createDefaultState() });

  const ensureKey = (pageKey) => (pageKey || 'default');
  const getSearchState = useCallback((pageKey = 'default') => {
    return searchStates[ensureKey(pageKey)] || createDefaultState();
  }, [searchStates]);

  // Update dynamic fields based on property data (memoized to prevent excessive updates)
  const updateDynamicFields = useCallback((properties, pageKey = 'default') => {
    if (!properties || properties.length === 0) return;

    const newFields = new Set();
    const disallowed = new Set(['bedrooms', 'bathrooms']);
    properties.forEach(property => {
      Object.keys(property).forEach(key => {
        if (disallowed.has(key)) return; // ignore legacy fields
        if (property[key] !== undefined && property[key] !== null) {
          newFields.add(key);
        }
      });
    });

    setSearchStates(prev => {
      const key = ensureKey(pageKey);
      const prevState = prev[key] || createDefaultState();
      const currentFields = Array.from(prevState.dynamicFields).sort().join(',');
      const newFieldsArray = Array.from(newFields).sort().join(',');
      if (currentFields === newFieldsArray) return prev;
      return { ...prev, [key]: { ...prevState, dynamicFields: newFields } };
    });
  }, []);

  // Get field type based on centralized schema and value inference
  const getFieldType = useCallback((fieldName, value) => {
    // No legacy overrides needed; using CustomFieldOne/CustomFieldTwo instead
    // Prefer schema mapping
    const schemaField = PROPERTY_FIELDS_MAP[fieldName];
    if (schemaField?.type) return schemaField.type;

    // Fallback to derived metadata
    if (SCHEMA_METADATA.text.includes(fieldName)) return 'text';
    if (SCHEMA_METADATA.numeric.includes(fieldName)) return 'numeric';
    if (SCHEMA_METADATA.boolean.includes(fieldName)) return 'boolean';
    if (SCHEMA_METADATA.enum[fieldName]) return 'enum';
    if (SCHEMA_METADATA.date.includes(fieldName)) return 'date';
    if (SCHEMA_METADATA.images.includes(fieldName)) return 'images';

    // Infer type from value
    if (typeof value === 'string') {
      // Check if it's a date string
      if (!isNaN(Date.parse(value)) && value.includes('-')) return 'date';
      // Check if it's numeric
      if (!isNaN(parseFloat(value))) return 'numeric';
      return 'text';
    }
    if (typeof value === 'number') return 'numeric';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    
    return 'text'; // Default to text
  }, []);

  // Set search term (optimized to prevent unnecessary re-renders)
  const setSearchTerm = useCallback((term, pageKey = 'default') => {
    setSearchStates(prev => {
      const key = ensureKey(pageKey);
      const prevState = prev[key] || createDefaultState();
      if (prevState.searchTerm === term) return prev;
      return { ...prev, [key]: { ...prevState, searchTerm: term } };
    });
  }, []);

  // Set filter for a specific field (optimized to prevent unnecessary re-renders)
  const setFilter = useCallback((field, value, pageKey = 'default') => {
    setSearchStates(prev => {
      const key = ensureKey(pageKey);
      const prevState = prev[key] || createDefaultState();
      if (prevState.filters[field] === value) return prev; // No change
      return {
        ...prev,
        [key]: {
          ...prevState,
          filters: {
            ...prevState.filters,
            [field]: value
          }
        }
      };
    });
  }, []);

  // Clear specific filter
  const clearFilter = useCallback((field, pageKey = 'default') => {
    setSearchStates(prev => {
      const key = ensureKey(pageKey);
      const prevState = prev[key] || createDefaultState();
      const newFilters = { ...prevState.filters };
      delete newFilters[field];
      return { ...prev, [key]: { ...prevState, filters: newFilters } };
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback((pageKey = 'default') => {
    setSearchStates(prev => {
      const key = ensureKey(pageKey);
      const prevState = prev[key] || createDefaultState();
      return { ...prev, [key]: { ...prevState, searchTerm: '', filters: {} } };
    });
  }, []);

  // Set sorting
  const setSort = useCallback((field, order = 'asc', pageKey = 'default') => {
    setSearchStates(prev => {
      const key = ensureKey(pageKey);
      const prevState = prev[key] || createDefaultState();
      return { ...prev, [key]: { ...prevState, sortBy: field, sortOrder: order } };
    });
  }, []);

  // Grouping controls
  const setGroupBy = useCallback((groupConfig, pageKey = 'default') => {
    // groupConfig: null to clear, or { field, order }
    setSearchStates(prev => {
      const key = ensureKey(pageKey);
      const prevState = prev[key] || createDefaultState();
      return { ...prev, [key]: { ...prevState, groupBy: groupConfig || null } };
    });
  }, []);
  const clearGroupBy = useCallback((pageKey = 'default') => {
    setGroupBy(null, pageKey);
  }, [setGroupBy]);

  // Filter properties based on search state
  const filterProperties = useCallback((properties, pageKey = 'default') => {
    if (!properties) return [];
    const state = getSearchState(pageKey);

    let filtered = [...properties];

    // Apply text search
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(property => {
        // Search in all text fields
        return SCHEMA_METADATA.text.some(field => {
          const value = property[field];
          return value && String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply field filters
    Object.entries(state.filters).forEach(([field, filterValue]) => {
      if (filterValue === undefined || filterValue === null || filterValue === '') return;

    // Special synthetic filters
    if (field === 'followUp') {
      // Treat as presence/absence of followUpDate
      filtered = filtered.filter((property) => Boolean(property.followUpDate) === Boolean(filterValue));
      return;
    }

      const fieldType = getFieldType(field, filtered[0]?.[field]);

      filtered = filtered.filter(property => {
        const value = property[field];

        switch (fieldType) {
          case 'text':
            return value && String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          
          case 'numeric':
            // Special handling for CAP Rate: normalize values to percent scale for comparison
            const normalizeCapRate = (val) => {
              if (val === undefined || val === null) return NaN;
              if (typeof val === 'number') {
                const numeric = Number(val);
                if (!Number.isFinite(numeric)) return NaN;
                return numeric <= 1 ? numeric * 100 : numeric;
              }
              if (typeof val === 'string') {
                const hasPercent = val.includes('%');
                const cleaned = val.replace(/[^0-9.\-]/g, '');
                const n = parseFloat(cleaned);
                if (!Number.isFinite(n)) return NaN;
                return hasPercent ? n : (n <= 1 ? n * 100 : n);
              }
              return NaN;
            };

            if (typeof filterValue === 'object' && filterValue !== null) {
              const numValue = field === 'cap_rate' ? normalizeCapRate(value) : extractNumeric(value);
              if (filterValue.min !== undefined && numValue < filterValue.min) return false;
              if (filterValue.max !== undefined && numValue > filterValue.max) return false;
              return true;
            }
            if (field === 'cap_rate') {
              return normalizeCapRate(value) === normalizeCapRate(filterValue);
            }
            return extractNumeric(value) === extractNumeric(filterValue);
          
          case 'boolean':
            return Boolean(value) === Boolean(filterValue);
          
          case 'enum':
            return value === filterValue;
          
          case 'date':
            if (typeof filterValue === 'object' && filterValue !== null) {
              const dateValue = new Date(value);
              if (filterValue.from && dateValue < new Date(filterValue.from)) return false;
              if (filterValue.to && dateValue > new Date(filterValue.to)) return false;
              return true;
            }
            return new Date(value).toDateString() === new Date(filterValue).toDateString();
          
          case 'array':
            return Array.isArray(value) && value.length > 0;
          
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (state.sortBy) {
      const sortField = state.sortBy;
      const sortType = getFieldType(sortField, filtered[0]?.[sortField]);
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (sortType === 'numeric') {
          if (sortField === 'cap_rate') {
            const norm = (val) => {
              if (val === undefined || val === null) return 0;
              if (typeof val === 'number') return val <= 1 ? val * 100 : val;
              const hasPercent = typeof val === 'string' && val.includes('%');
              const cleaned = String(val).replace(/[^0-9.\-]/g, '');
              const n = parseFloat(cleaned);
              if (!Number.isFinite(n)) return 0;
              return hasPercent ? n : (n <= 1 ? n * 100 : n);
            };
            comparison = norm(aValue) - norm(bValue);
          } else {
            comparison = (extractNumeric(aValue) || 0) - (extractNumeric(bValue) || 0);
          }
        } else if (sortType === 'date') {
          comparison = new Date(aValue) - new Date(bValue);
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          // Fallback: string compare
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return state.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [getSearchState, updateDynamicFields, getFieldType]);

  // Get all available fields from dynamic fields and metadata
  const getAvailableFields = useCallback((pageKey = 'default') => {
    const state = getSearchState(pageKey);
    const schemaFields = PROPERTY_FIELDS.map((f) => f.name);
    const enumFields = Object.keys(SCHEMA_METADATA.enum);
    const allFields = new Set([
      ...schemaFields,
      ...enumFields,
      ...(state.dynamicFields || new Set())
    ]);

    return Array.from(allFields).map(field => ({
      name: field,
      type: getFieldType(field),
      label: (PROPERTY_FIELDS_MAP[field]?.label) || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      options: (PROPERTY_FIELDS_MAP[field]?.options) || SCHEMA_METADATA.enum[field] || null
    }));
  }, [getSearchState, getFieldType]);

  const value = {
    // Backward-compatible default state (global)
    searchState: getSearchState('default'),
    // Per-page accessors
    getSearchState,
    setSearchTerm,
    setFilter,
    clearFilter,
    clearAllFilters,
    setSort,
    setGroupBy,
    clearGroupBy,
    filterProperties,
    getAvailableFields,
    getFieldType,
    updateDynamicFields
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};