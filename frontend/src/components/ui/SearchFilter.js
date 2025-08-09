import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Collapse,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSearch } from '../../contexts/SearchContext';
import { debounce } from '../../utils';

function SearchFilter({ properties = [], variant = 'default', showAdvanced = true }) {
  const {
    searchState,
    setSearchTerm,
    setFilter,
    clearFilter,
    clearAllFilters,
    setSort,
    availableFields,
    getFieldType
  } = useSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchState.searchTerm);
  // Pending (local) filter state to apply on demand
  const [pendingFilters, setPendingFilters] = useState(searchState.filters);
  const [pendingSortBy, setPendingSortBy] = useState(searchState.sortBy);
  const [pendingSortOrder, setPendingSortOrder] = useState(searchState.sortOrder);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Update dynamic fields when properties change
  useEffect(() => {
    if (properties.length > 0) {
      // This will trigger updateDynamicFields in the context
      // when filterProperties is called
    }
  }, [properties]);

  // Debounced search
  const debouncedSearch = React.useMemo(
    () => debounce((value) => {
      setSearchTerm(value);
    }, 300),
    [setSearchTerm]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (field, value) => {
    setPendingFilters(prev => {
      const next = { ...prev };
      if (value === '' || value === null || value === undefined) {
        delete next[field];
      } else {
        next[field] = value;
      }
      return next;
    });
    setHasPendingChanges(true);
  };

  const handleApply = () => {
    // Remove filters that were cleared locally
    Object.keys(searchState.filters).forEach((field) => {
      const pendingValue = pendingFilters[field];
      if (pendingValue === undefined || pendingValue === '' || pendingValue === null) {
        clearFilter(field);
      }
    });
    // Apply pending filters
    Object.entries(pendingFilters).forEach(([field, value]) => {
      if (!(value === undefined || value === '' || value === null)) {
        setFilter(field, value);
      }
    });
    // Apply sorting
    if (pendingSortBy !== searchState.sortBy || pendingSortOrder !== searchState.sortOrder) {
      setSort(pendingSortBy, pendingSortOrder);
    }
    setShowFilters(false);
    setHasPendingChanges(false);
  };

  // Sync pending state with committed state when panel closes or committed state changes externally
  useEffect(() => {
    if (!showFilters) {
      setPendingFilters(searchState.filters);
      setPendingSortBy(searchState.sortBy);
      setPendingSortOrder(searchState.sortOrder);
      setHasPendingChanges(false);
    }
  }, [searchState.filters, searchState.sortBy, searchState.sortOrder, showFilters]);

  const renderFilterControl = (field) => {
    const currentValue = pendingFilters[field.name] || '';

    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={field.name}
            label={field.label}
            value={currentValue}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
          />
        );

      case 'numeric':
        // Get min/max values from properties
        const numericValues = properties
          .map(p => parseFloat(p[field.name]))
          .filter(v => !isNaN(v));
        const min = Math.min(...numericValues) || 0;
        const max = Math.max(...numericValues) || 100;
        const range = currentValue || { min, max };

        return (
          <Box key={field.name}>
            <Typography gutterBottom>{field.label}</Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={[range.min || min, range.max || max]}
                onChange={(e, newValue) => {
                  handleFilterChange(field.name, { min: newValue[0], max: newValue[1] });
                }}
                valueLabelDisplay="auto"
                min={min}
                max={max}
              />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">{range.min || min}</Typography>
              <Typography variant="caption">{range.max || max}</Typography>
            </Box>
          </Box>
        );

      case 'boolean':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Switch
                checked={currentValue === true}
                onChange={(e) => handleFilterChange(field.name, e.target.checked ? true : '')}
              />
            }
            label={field.label}
          />
        );

      case 'enum':
        return (
          <FormControl key={field.name} size="small" fullWidth>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={currentValue}
              label={field.label}
              onChange={(e) => handleFilterChange(field.name, e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {field.options?.map(option => (
                <MenuItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        const dateRange = currentValue || { from: null, to: null };
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <DatePicker
                  selected={dateRange.from}
                  onChange={(date) => {
                    handleFilterChange(field.name, { ...dateRange, from: date });
                  }}
                  placeholderText="From date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="MM/dd/yyyy"
                />
              </div>
              <div>
                <DatePicker
                  selected={dateRange.to}
                  onChange={(date) => {
                    handleFilterChange(field.name, { ...dateRange, to: date });
                  }}
                  placeholderText="To date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="MM/dd/yyyy"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Group fields by type for better organization
  const groupedFields = availableFields.reduce((acc, field) => {
    // Skip special fields and fields that might not be useful for filtering
    if (field.type === 'special' || field.type === 'object' || field.name === 'id' || field.name === '_id') {
      return acc;
    }
    
    const group = field.type === 'text' ? 'Text Fields' :
                  field.type === 'numeric' ? 'Numeric Fields' :
                  field.type === 'boolean' ? 'Boolean Fields' :
                  field.type === 'enum' ? 'Status Fields' :
                  field.type === 'date' ? 'Date Fields' : 'Other';
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  const activeFiltersCount = Object.keys(searchState.filters).length;

  if (variant === 'compact') {
    return (
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search properties..."
          value={localSearchTerm}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: localSearchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => {
                  setLocalSearchTerm('');
                  setSearchTerm('');
                }}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Search Bar with Filter Toggle */}
      <Box display="flex" gap={1} alignItems="center" mb={2}>
        <TextField
          fullWidth
          placeholder="Search by title, description, location, property type, email..."
          value={localSearchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: localSearchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => {
                  setLocalSearchTerm('');
                  setSearchTerm('');
                }}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {showAdvanced && (
          <Button
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ minWidth: 120 }}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                color="primary"
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Button>
        )}
        {showAdvanced && (
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={!hasPendingChanges}
            sx={{ minWidth: 100 }}
          >
            Apply
          </Button>
        )}
      </Box>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <Box display="flex" gap={1} mb={2} flexWrap="wrap" alignItems="center">
          <Typography variant="body2" color="textSecondary">Active filters:</Typography>
          {Object.entries(searchState.filters).map(([fieldName, value]) => {
            const field = availableFields.find(f => f.name === fieldName);
            let displayValue = value;
            
            if (typeof value === 'object' && value !== null) {
              if (value.min !== undefined || value.max !== undefined) {
                displayValue = `${value.min || 'Any'} - ${value.max || 'Any'}`;
              } else if (value.from || value.to) {
                displayValue = `${value.from ? new Date(value.from).toLocaleDateString() : 'Any'} - ${value.to ? new Date(value.to).toLocaleDateString() : 'Any'}`;
              }
            } else if (typeof value === 'boolean') {
              displayValue = value ? 'Yes' : 'No';
            }
            
            return (
              <Chip
                key={fieldName}
                label={`${field?.label || fieldName}: ${displayValue}`}
                onDelete={() => clearFilter(fieldName)}
                size="small"
                variant="outlined"
              />
            );
          })}
          <Button size="small" onClick={clearAllFilters}>Clear All</Button>
        </Box>
      )}

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Grid container spacing={2}>
            {/* Sort Controls */}
            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={pendingSortBy}
                      label="Sort By"
                      onChange={(e) => { setPendingSortBy(e.target.value); setHasPendingChanges(true); }}
                    >
                      {availableFields
                        .filter(f => f.type !== 'special' && f.type !== 'array')
                        .map(field => (
                          <MenuItem key={field.name} value={field.name}>
                            {field.label}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Order</InputLabel>
                    <Select
                      value={pendingSortOrder}
                      label="Order"
                      onChange={(e) => { setPendingSortOrder(e.target.value); setHasPendingChanges(true); }}
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* Grouped Filters */}
            {Object.entries(groupedFields).map(([groupName, fields]) => (
              <Grid item xs={12} key={groupName}>
                <Accordion defaultExpanded={groupName === 'Status Fields' || groupName === 'Boolean Fields'}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">{groupName}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {fields.map(field => (
                        <Grid item xs={12} sm={6} md={4} key={field.name}>
                          {renderFilterControl(field)}
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
            <Button
              onClick={() => { setPendingFilters({}); setHasPendingChanges(true); }}
              variant="outlined"
            >
              Clear All Filters
            </Button>
            <Button onClick={handleApply} variant="contained" disabled={!hasPendingChanges}>
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

export default SearchFilter;