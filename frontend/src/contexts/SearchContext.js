import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { PROPERTY_FIELDS, PROPERTY_FIELDS_MAP } from '../constants/propertySchema';

const SearchContext = createContext();

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

export const SearchProvider = ({ children }) => {
  const [searchState, setSearchState] = useState({
    searchTerm: '',
    filters: {},
    sortBy: 'createdAt',
    sortOrder: 'desc',
    dynamicFields: new Set() // Track fields discovered from actual data
  });

  // Update dynamic fields based on property data (memoized to prevent excessive updates)
  const updateDynamicFields = useCallback((properties) => {
    if (!properties || properties.length === 0) return;

    const newFields = new Set();
    properties.forEach(property => {
      Object.keys(property).forEach(key => {
        if (property[key] !== undefined && property[key] !== null) {
          newFields.add(key);
        }
      });
    });

    // Only update if fields have actually changed
    setSearchState(prev => {
      const currentFields = Array.from(prev.dynamicFields).sort().join(',');
      const newFieldsArray = Array.from(newFields).sort().join(',');
      
      if (currentFields === newFieldsArray) {
        return prev; // No change, don't trigger re-render
      }
      
      return {
        ...prev,
        dynamicFields: newFields
      };
    });
  }, []);

  // Get field type based on centralized schema and value inference
  const getFieldType = useCallback((fieldName, value) => {
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
  const setSearchTerm = useCallback((term) => {
    setSearchState(prev => prev.searchTerm === term ? prev : ({ ...prev, searchTerm: term }));
  }, []);

  // Set filter for a specific field (optimized to prevent unnecessary re-renders)
  const setFilter = useCallback((field, value) => {
    setSearchState(prev => {
      if (prev.filters[field] === value) return prev; // No change
      return {
        ...prev,
        filters: {
          ...prev.filters,
          [field]: value
        }
      };
    });
  }, []);

  // Clear specific filter
  const clearFilter = useCallback((field) => {
    setSearchState(prev => {
      const newFilters = { ...prev.filters };
      delete newFilters[field];
      return {
        ...prev,
        filters: newFilters
      };
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      searchTerm: '',
      filters: {}
    }));
  }, []);

  // Set sorting
  const setSort = useCallback((field, order = 'asc') => {
    setSearchState(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: order
    }));
  }, []);

  // Filter properties based on search state
  const filterProperties = useCallback((properties) => {
    if (!properties) return [];

    let filtered = [...properties];

    // Apply text search
    if (searchState.searchTerm) {
      const searchLower = searchState.searchTerm.toLowerCase();
      filtered = filtered.filter(property => {
        // Search in all text fields
        return SCHEMA_METADATA.text.some(field => {
          const value = property[field];
          return value && String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply field filters
    Object.entries(searchState.filters).forEach(([field, filterValue]) => {
      if (filterValue === undefined || filterValue === null || filterValue === '') return;

      const fieldType = getFieldType(field, filtered[0]?.[field]);

      filtered = filtered.filter(property => {
        const value = property[field];

        switch (fieldType) {
          case 'text':
            return value && String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          
          case 'numeric':
            if (typeof filterValue === 'object' && filterValue !== null) {
              const numValue = parseFloat(value);
              if (filterValue.min !== undefined && numValue < filterValue.min) return false;
              if (filterValue.max !== undefined && numValue > filterValue.max) return false;
              return true;
            }
            return parseFloat(value) === parseFloat(filterValue);
          
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
    if (searchState.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[searchState.sortBy];
        const bValue = b[searchState.sortBy];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (typeof aValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date || !isNaN(Date.parse(aValue))) {
          comparison = new Date(aValue) - new Date(bValue);
        }

        return searchState.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [searchState.searchTerm, searchState.filters, searchState.sortBy, searchState.sortOrder, updateDynamicFields, getFieldType]);

  // Get all available fields from dynamic fields and metadata
  const availableFields = useMemo(() => {
    const schemaFields = PROPERTY_FIELDS.map((f) => f.name);
    const enumFields = Object.keys(SCHEMA_METADATA.enum);
    const allFields = new Set([
      ...schemaFields,
      ...enumFields,
      ...searchState.dynamicFields
    ]);

    return Array.from(allFields).map(field => ({
      name: field,
      type: getFieldType(field),
      label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      options: (PROPERTY_FIELDS_MAP[field]?.options) || SCHEMA_METADATA.enum[field] || null
    }));
  }, [searchState.dynamicFields, getFieldType]);

  const value = {
    searchState,
    setSearchTerm,
    setFilter,
    clearFilter,
    clearAllFilters,
    setSort,
    filterProperties,
    availableFields,
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