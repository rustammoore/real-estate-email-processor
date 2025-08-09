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

  // Debounced search for compact/no-advanced mode only
  const debouncedSearch = React.useMemo(
    () => debounce((value) => {
      setSearchTerm(value);
    }, 300),
    [setSearchTerm]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    if (variant === 'compact' || !showAdvanced) {
      // In compact mode (no Apply button), update immediately (debounced)
      debouncedSearch(value);
    } else {
      // In default mode with Apply button, mark as pending and only apply on click
      setHasPendingChanges(value !== searchState.searchTerm || hasPendingChanges);
    }
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
    // Apply search term if changed
    if (localSearchTerm !== searchState.searchTerm) {
      setSearchTerm(localSearchTerm);
    }
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
      // Keep pending flag if local search differs from committed state
      setHasPendingChanges(localSearchTerm !== searchState.searchTerm);
    }
  }, [searchState.filters, searchState.sortBy, searchState.sortOrder, searchState.searchTerm, showFilters, localSearchTerm]);

  // Keep local search term in sync when committed search term changes externally (e.g., Clear All)
  useEffect(() => {
    if (variant === 'compact' || !showAdvanced) {
      setLocalSearchTerm(searchState.searchTerm);
    } else if (!showFilters) {
      setLocalSearchTerm(searchState.searchTerm);
    }
  }, [searchState.searchTerm, showFilters, variant, showAdvanced]);

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
            sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
          />
        );

      case 'numeric':
        // Collect numeric values across properties for dynamic bounds
        const numericValues = properties
          .map(p => parseFloat(p[field.name]))
          .filter(v => Number.isFinite(v));

        let computedMin;
        let computedMax;
        if (numericValues.length === 0) {
          computedMin = 0;
          computedMax = 100;
        } else {
          computedMin = Math.min(...numericValues);
          computedMax = Math.max(...numericValues);
          if (!Number.isFinite(computedMin)) computedMin = 0;
          if (!Number.isFinite(computedMax)) computedMax = 100;
        }
        // Ensure there is visible range (two thumbs shouldn't overlap)
        if (computedMin === computedMax) {
          computedMax = computedMin + 1;
        }

        const initialRange = (currentValue && typeof currentValue === 'object')
          ? currentValue
          : { min: computedMin, max: computedMax };

        const clampedMin = Math.max(computedMin, Number(initialRange.min ?? computedMin));
        const clampedMax = Math.min(computedMax, Number(initialRange.max ?? computedMax));

        return (
          <Box key={field.name}>
            <Typography gutterBottom variant="caption">{field.label}</Typography>
            <Box sx={{ px: 0.5 }}>
              <Slider
                size="small"
                value={[clampedMin, clampedMax]}
                onChange={(e, newValue) => {
                  const [newMin, newMax] = newValue;
                  handleFilterChange(field.name, { min: newMin, max: newMax });
                }}
                valueLabelDisplay="auto"
                min={computedMin}
                max={computedMax}
                disableSwap
              />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">{clampedMin}</Typography>
              <Typography variant="caption">{clampedMax}</Typography>
            </Box>
          </Box>
        );

      case 'boolean':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Switch
                size="small"
                checked={currentValue === true}
                onChange={(e) => handleFilterChange(field.name, e.target.checked ? true : '')}
              />
            }
            label={<Typography variant="caption">{field.label}</Typography>}
            sx={{ m: 0, '& .MuiFormControlLabel-label': { ml: 0.5 } }}
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
              MenuProps={{
                PaperProps: {
                  sx: { '& .MuiMenuItem-root': { minHeight: 28, py: 0.25, fontSize: '0.8rem' } }
                }
              }}
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
            <Typography variant="caption" className="block mb-1">{field.label}</Typography>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <DatePicker
                  selected={dateRange.from}
                  onChange={(date) => {
                    handleFilterChange(field.name, { ...dateRange, from: date });
                  }}
                  placeholderText="From"
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="MM/dd/yyyy"
                />
              </div>
              <div>
                <DatePicker
                  selected={dateRange.to}
                  onChange={(date) => {
                    handleFilterChange(field.name, { ...dateRange, to: date });
                  }}
                  placeholderText="To"
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

  // Identify quick compact fields
  const quickBooleanNames = ['liked', 'loved', 'archived', 'deleted', 'followUp'];
  const quickBooleanFields = availableFields.filter(f => f.type === 'boolean' && quickBooleanNames.includes(f.name));
  const statusField = availableFields.find(f => f.name === 'status');
  // Inject synthetic boolean for follow-ups: treat as has followUpDate
  const hasFollowUpField = { name: 'followUp', type: 'boolean', label: 'Follow-ups' };
  const includeFollowUpSynthetic = true;
  const quickNames = new Set([
    ...quickBooleanFields.map(f => f.name),
    statusField?.name,
    includeFollowUpSynthetic ? hasFollowUpField.name : undefined
  ].filter(Boolean));

  // Group remaining fields by type for better organization
  const groupedFields = availableFields.reduce((acc, field) => {
    // Skip fields that are rendered in the quick compact row
    if (quickNames.has(field.name)) return acc;
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
                  if (variant === 'compact' || !showAdvanced) {
                    setSearchTerm('');
                  } else {
                    setHasPendingChanges(searchState.searchTerm !== '');
                  }
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
      <Box display="flex" gap={0.5} alignItems="center" mb={1}>
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
                  if (variant === 'compact' || !showAdvanced) {
                    setSearchTerm('');
                  } else {
                    setHasPendingChanges(searchState.searchTerm !== '');
                  }
                }}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {showAdvanced && (
          <Button
            size="small"
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ minWidth: 90, py: 0.5 }}
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
            size="small"
            variant="contained"
            onClick={handleApply}
            disabled={!hasPendingChanges}
            sx={{ minWidth: 90, py: 0.5 }}
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
        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Grid container spacing={1}>
            {/* Sort Controls */}
            <Grid item xs={12}>
              <Grid container spacing={1} alignItems="center">
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

            {/* Quick compact row: Liked, Loved, Archived, Deleted toggles + Status select */}
            {((quickBooleanFields.length > 0) || statusField || includeFollowUpSynthetic) && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  {quickBooleanFields.map((field) => (
                    <FormControlLabel
                      key={field.name}
                      control={
                        <Switch
                          size="small"
                          checked={pendingFilters[field.name] === true}
                          onChange={(e) => { handleFilterChange(field.name, e.target.checked ? true : ''); }}
                        />
                      }
                      label={<Typography variant="caption">{field.label}</Typography>}
                      sx={{ m: 0, '& .MuiFormControlLabel-label': { ml: 0.5 } }}
                    />
                  ))}
                  {includeFollowUpSynthetic && (
                    <FormControlLabel
                      key={hasFollowUpField.name}
                      control={
                        <Switch
                          size="small"
                          checked={Boolean(pendingFilters[hasFollowUpField.name]) === true}
                          onChange={(e) => { handleFilterChange(hasFollowUpField.name, e.target.checked ? true : ''); }}
                        />
                      }
                      label={<Typography variant="caption">{hasFollowUpField.label}</Typography>}
                      sx={{ m: 0, '& .MuiFormControlLabel-label': { ml: 0.5 } }}
                    />
                  )}
                  {/* Pending review toggle (maps to status === 'pending') */}
                  <FormControlLabel
                    key="status-pending-toggle"
                    control={
                      <Switch
                        size="small"
                        checked={(pendingFilters.status || '') === 'pending'}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleFilterChange('status', checked ? 'pending' : '');
                        }}
                      />
                    }
                    label={<Typography variant="caption">Pending review</Typography>}
                    sx={{ m: 0, '& .MuiFormControlLabel-label': { ml: 0.5 } }}
                  />
                  {statusField && (
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={pendingFilters.status || ''}
                        label="Status"
                        onChange={(e) => { handleFilterChange('status', e.target.value); }}
                        MenuProps={{
                          PaperProps: { sx: { '& .MuiMenuItem-root': { minHeight: 28, py: 0.25, fontSize: '0.8rem' } } }
                        }}
                      >
                        <MenuItem value="">All</MenuItem>
                        {(statusField.options || []).map((option) => (
                          <MenuItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              </Grid>
            )}

            {/* Grouped Filters */}
            {Object.entries(groupedFields).map(([groupName, fields]) => (
              <Grid item xs={12} key={groupName}>
                <Accordion defaultExpanded={groupName === 'Status Fields' || groupName === 'Boolean Fields'} sx={{ '& .MuiAccordionSummary-root': { minHeight: 32 }, '& .MuiAccordionSummary-content': { my: 0 } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="caption">{groupName}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0.5 }}>
                    <Grid container spacing={1}>
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
              size="small"
              onClick={() => { setPendingFilters({}); setHasPendingChanges(true); }}
              variant="outlined"
              sx={{ py: 0.5 }}
            >
              Clear All Filters
            </Button>
            <Button size="small" onClick={handleApply} variant="contained" disabled={!hasPendingChanges} sx={{ py: 0.5 }}>
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

export default SearchFilter;