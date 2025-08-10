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
import api from '../../services/api';
import { debounce, parseNumericValue } from '../../utils';
import { PROPERTY_FIELDS } from '../../constants/propertySchema';

function SearchFilter({ properties = [], variant = 'default', showAdvanced = true, pageKey = 'default' }) {
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
  // Local drafts for numeric inputs to avoid aggressive re-formatting while typing
  const [inputDrafts, setInputDrafts] = useState({}); // key: `${fieldName}-min|max` -> string
  const [focusedInputs, setFocusedInputs] = useState({}); // key -> boolean

  // Saved Views state
  const [views, setViews] = useState([]);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState('');
  const [newViewName, setNewViewName] = useState('');

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

  // Load saved views for this page
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoadingViews(true);
        const data = await api.listViews(pageKey);
        if (!mounted) return;
        setViews(Array.isArray(data) ? data : []);
        // Apply default view if present and no current search/filters
        const defaultView = (Array.isArray(data) ? data : []).find(v => v.isDefault);
        const hasLocalState = Boolean(searchState.searchTerm) || Object.keys(searchState.filters || {}).length > 0;
        if (defaultView && !hasLocalState) {
          applyViewState(defaultView);
          setSelectedViewId(defaultView.id);
        }
      } catch (_) {
        // silently ignore
      } finally {
        if (mounted) setIsLoadingViews(false);
      }
    };
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  const applyViewState = (view) => {
    if (!view) return;
    // Apply search
    setLocalSearchTerm(view.searchTerm || '');
    setSearchTerm(view.searchTerm || '');
    // Apply filters: clear existing then set new
    Object.keys(searchState.filters || {}).forEach((field) => clearFilter(field));
    setPendingFilters(view.filters || {});
    Object.entries(view.filters || {}).forEach(([field, value]) => setFilter(field, value));
    // Apply sort
    if (view.sortBy) {
      setPendingSortBy(view.sortBy);
      setPendingSortOrder(view.sortOrder || 'desc');
      setSort(view.sortBy, view.sortOrder || 'desc');
    }
    setHasPendingChanges(false);
  };

  const handleApplyView = (id) => {
    if (!id) {
      // Apply None: clear search and filters, keep current sort settings
      setLocalSearchTerm('');
      setSearchTerm('');
      setPendingFilters({});
      Object.keys(searchState.filters || {}).forEach((field) => clearFilter(field));
      setHasPendingChanges(false);
      setSelectedViewId('');
      return;
    }
    const view = views.find(v => String(v.id) === String(id));
    if (view) {
      applyViewState(view);
      setSelectedViewId(id);
    }
  };

  const handleSaveView = async () => {
    if (!newViewName.trim()) return;
    const payload = {
      pageKey,
      name: newViewName.trim(),
      searchTerm: localSearchTerm,
      filters: pendingFilters,
      sortBy: pendingSortBy,
      sortOrder: pendingSortOrder,
    };
    try {
      const created = await api.createView(payload);
      setViews(prev => [created, ...prev]);
      setNewViewName('');
      setSelectedViewId(created.id);
    } catch (_) {
      // ignore
    }
  };

  const handleDeleteView = async (id) => {
    try {
      await api.deleteView(id);
      setViews(prev => prev.filter(v => String(v.id) !== String(id)));
      if (String(selectedViewId) === String(id)) setSelectedViewId('');
    } catch (_) {}
  };

  const handleSetDefault = async (id) => {
    try {
      await api.setDefaultView(id);
      setViews(prev => prev.map(v => ({ ...v, isDefault: String(v.id) === String(id) })));
    } catch (_) {}
  };

  const formatCurrency = React.useCallback((value, maxFractionDigits = 2) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value ?? '');
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFractionDigits
      }).format(num);
    } catch (e) {
      return String(value ?? '');
    }
  }, []);

  const isCurrencyField = (fieldName) => fieldName === 'price' || fieldName === 'price_per_ft';

  const getMaxFractionDigits = (fieldName) => {
    if (isCurrencyField(fieldName)) return 2;
    if (fieldName === 'cap_rate') return 2;
    if (fieldName === 'square_feet') return 0;
    return 2;
  };

  const formatNumberForInput = React.useCallback((value, fieldName) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '';
    const maximumFractionDigits = getMaxFractionDigits(fieldName);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits
      }).format(num);
    } catch (e) {
      return String(num);
    }
  }, []);

  const setFocus = (key, focused) => {
    setFocusedInputs(prev => ({ ...prev, [key]: focused }));
  };
  const setDraft = (key, value) => {
    setInputDrafts(prev => ({ ...prev, [key]: value }));
  };

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
            onChange={(e) => {
              const raw = e.target.value;
              if (field.name === 'state') {
                const normalized = raw.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
                handleFilterChange(field.name, normalized);
              } else {
                handleFilterChange(field.name, raw);
              }
            }}
            onBlur={(e) => {
              if (field.name === 'state') {
                const raw = e.target.value || '';
                const normalized = raw.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
                if (normalized !== raw) {
                  handleFilterChange(field.name, normalized);
                }
              }
            }}
            inputProps={field.name === 'state' ? { maxLength: 2, style: { textTransform: 'uppercase' } } : undefined}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
          />
        );

      case 'numeric':
        // Collect numeric values across properties for dynamic bounds
        const numericValues = properties
          .map(p => {
            const raw = p[field.name];
            // Special handling for CAP Rate: normalize to percent scale
            if (field.name === 'cap_rate') {
              if (typeof raw === 'number') {
                const numeric = Number(raw);
                if (!Number.isFinite(numeric)) return NaN;
                // If value is decimal (<= 1), convert to percent
                return numeric <= 1 ? numeric * 100 : numeric;
              }
              if (typeof raw === 'string') {
                const hasPercent = raw.includes('%');
                const cleaned = raw.replace(/[^0-9.\-]/g, '');
                const n = parseFloat(cleaned);
                if (!Number.isFinite(n)) return NaN;
                return hasPercent ? n : (n <= 1 ? n * 100 : n);
              }
              return NaN;
            }

            // Generic numeric extraction
            if (typeof raw === 'number') return raw;
            if (typeof raw === 'string') {
              const cleaned = raw.replace(/[^0-9.\-]/g, '');
              const n = parseFloat(cleaned);
              return Number.isFinite(n) ? n : NaN;
            }
            return NaN;
          })
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

        // Default numeric inputs to empty values instead of auto-filling dynamic bounds
        const initialRange = (currentValue && typeof currentValue === 'object')
          ? currentValue
          : { min: undefined, max: undefined };

        const clampedMin = Math.max(computedMin, Number(initialRange.min ?? computedMin));
        const clampedMax = Math.min(computedMax, Number(initialRange.max ?? computedMax));

        const minKey = `${field.name}-min`;
        const maxKey = `${field.name}-max`;

        const handleMinInputChange = (e) => {
          const parsed = parseNumericValue(e.target.value);
          let adjusted = parsed;
          if (field.name === 'cap_rate' && adjusted !== null && !Number.isNaN(adjusted) && adjusted <= 1) {
            adjusted = adjusted * 100; // treat decimals as percent
          }
          // Do not clamp to computed bounds; allow any user-entered number
          let newMin = adjusted === null || Number.isNaN(adjusted) ? undefined : adjusted;
          let newMax = initialRange.max;
          if (Number.isFinite(newMin) && Number.isFinite(newMax) && newMin > newMax) {
            newMax = newMin;
          }
          setDraft(minKey, e.target.value);
          if ((newMin === undefined || newMin === null) && (newMax === undefined || newMax === null)) {
            handleFilterChange(field.name, '');
          } else {
            handleFilterChange(field.name, { min: newMin, max: newMax });
          }
        };

        const handleMaxInputChange = (e) => {
          const parsed = parseNumericValue(e.target.value);
          let adjusted = parsed;
          if (field.name === 'cap_rate' && adjusted !== null && !Number.isNaN(adjusted) && adjusted <= 1) {
            adjusted = adjusted * 100; // treat decimals as percent
          }
          // Do not clamp to computed bounds; allow any user-entered number
          let newMax = adjusted === null || Number.isNaN(adjusted) ? undefined : adjusted;
          let newMin = initialRange.min;
          if (Number.isFinite(newMin) && Number.isFinite(newMax) && newMax < newMin) {
            newMin = newMax;
          }
          setDraft(maxKey, e.target.value);
          if ((newMin === undefined || newMin === null) && (newMax === undefined || newMax === null)) {
            handleFilterChange(field.name, '');
          } else {
            handleFilterChange(field.name, { min: newMin, max: newMax });
          }
        };

        return (
          <Box key={field.name}>
            <Typography gutterBottom variant="caption">{field.label}{field.name === 'cap_rate' ? ' (%)' : ''}</Typography>
            <Box sx={{ px: 2, display: 'flex', justifyContent: 'center' }}>
              <Slider
                sx={{ width: '88%' }}
                size="small"
                value={[clampedMin, clampedMax]}
                onChange={(e, newValue) => {
                  const [newMin, newMax] = Array.isArray(newValue) ? newValue : [computedMin, computedMax];
                  // Clear drafts so inputs reflect slider values cleanly
                  setDraft(minKey, undefined);
                  setDraft(maxKey, undefined);
                  handleFilterChange(field.name, { min: newMin, max: newMax });
                }}
                valueLabelDisplay="auto"
                valueLabelFormat={(val) => {
                  if (field.name === 'cap_rate') return `${val}%`;
                  if (isCurrencyField(field.name)) return formatCurrency(val, 2);
                  return formatNumberForInput(val, field.name);
                }}
                min={computedMin}
                max={computedMax}
                step={field.name === 'cap_rate' ? 0.01 : (isCurrencyField(field.name) ? 0.01 : 1)}
                disableSwap
              />
            </Box>
            <Box display="flex" gap={1} mt={0.5}>
              <TextField
                size="small"
                type="text"
                label="Min"
                value={
                  focusedInputs[minKey]
                    ? (inputDrafts[minKey] ?? '')
                    : (initialRange.min === undefined || initialRange.min === null ? '' : formatNumberForInput(initialRange.min, field.name))
                }
                onChange={handleMinInputChange}
                inputProps={{ inputMode: 'decimal' }}
                fullWidth
                onFocus={() => {
                  setFocus(minKey, true);
                  setDraft(minKey, initialRange.min === undefined || initialRange.min === null ? '' : String(initialRange.min));
                }}
                onBlur={() => {
                  setFocus(minKey, false);
                  const num = parseNumericValue(inputDrafts[minKey]);
                  setDraft(minKey, (num === null || Number.isNaN(num)) ? '' : formatNumberForInput(num, field.name));
                }}
                InputProps={
                  isCurrencyField(field.name)
                    ? { startAdornment: <InputAdornment position="start">$</InputAdornment> }
                    : field.name === 'cap_rate'
                      ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                      : undefined
                }
              />
              <TextField
                size="small"
                type="text"
                label="Max"
                value={
                  focusedInputs[maxKey]
                    ? (inputDrafts[maxKey] ?? '')
                    : (initialRange.max === undefined || initialRange.max === null ? '' : formatNumberForInput(initialRange.max, field.name))
                }
                onChange={handleMaxInputChange}
                inputProps={{ inputMode: 'decimal' }}
                fullWidth
                onFocus={() => {
                  setFocus(maxKey, true);
                  setDraft(maxKey, initialRange.max === undefined || initialRange.max === null ? '' : String(initialRange.max));
                }}
                onBlur={() => {
                  setFocus(maxKey, false);
                  const num = parseNumericValue(inputDrafts[maxKey]);
                  setDraft(maxKey, (num === null || Number.isNaN(num)) ? '' : formatNumberForInput(num, field.name));
                }}
                InputProps={
                  isCurrencyField(field.name)
                    ? { startAdornment: <InputAdornment position="start">$</InputAdornment> }
                    : field.name === 'cap_rate'
                      ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                      : undefined
                }
              />
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
              sx={field.name === 'property_type' ? { '& .MuiSelect-select': { py: 0.5 } } : undefined}
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
  // Order: Reviewed first, then Liked, Loved, Archived, Deleted
  const quickBooleanNames = ['reviewed', 'liked', 'loved', 'archived', 'deleted'];
  const quickBooleanFields = availableFields.filter(f => f.type === 'boolean' && quickBooleanNames.includes(f.name));
  // Enforce the desired order using schema names above
  const quickBooleanFieldsOrdered = quickBooleanNames
    .map((name) => quickBooleanFields.find((f) => f.name === name))
    .filter(Boolean);
  const statusField = availableFields.find(f => f.name === 'status');
  // Inject synthetic boolean for follow-ups: treat as has followUpDate
  const hasFollowUpField = { name: 'followUp', type: 'boolean', label: 'Follow-ups' };
  const includeFollowUpSynthetic = true;
  const quickNames = new Set([
    ...quickBooleanFields.map(f => f.name),
    statusField?.name,
    includeFollowUpSynthetic ? hasFollowUpField.name : undefined
  ].filter(Boolean));

  // Build schema order index to align with edit page ordering
  const schemaOrderIndex = React.useMemo(() => {
    const index = new Map();
    PROPERTY_FIELDS.forEach((f, i) => index.set(f.name, i));
    return index;
  }, []);

  // Group remaining fields by type for better organization
  const groupedFields = availableFields.reduce((acc, field) => {
    // Skip fields that are rendered in the quick compact row
    if (quickNames.has(field.name)) return acc;
    // Skip special fields and fields that might not be useful for filtering
    if (field.type === 'special' || field.type === 'object' || field.name === 'id' || field.name === '_id') {
      return acc;
    }

    // Do not hide bedrooms/bathrooms; backend now aliases them as CustomFieldOne/Two
    
    // Force some fields into Text Fields group to meet UX requirements
    const forceTextGroup = new Set(['property_type', 'email_source', 'email_subject', 'user', 'procured', 'address_hash']);
    const group = forceTextGroup.has(field.name)
      ? 'Text Fields'
      : field.type === 'text' ? 'Text Fields'
      : field.type === 'numeric' ? 'Numeric Fields'
      : field.type === 'boolean' ? 'Boolean Fields'
      : field.type === 'enum' ? 'Status Fields'
      : field.type === 'date' ? 'Date Fields' : 'Other';
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  // Sort fields within each group to follow schema order (similar to edit page)
  Object.keys(groupedFields).forEach((groupName) => {
    groupedFields[groupName].sort((a, b) => {
      const ai = schemaOrderIndex.get(a.name);
      const bi = schemaOrderIndex.get(b.name);
      const av = ai === undefined ? Number.MAX_SAFE_INTEGER : ai;
      const bv = bi === undefined ? Number.MAX_SAFE_INTEGER : bi;
      return av - bv;
    });
  });

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

      {/* Saved Views Controls */}
      {showAdvanced && (
        <Box display="flex" gap={1} mb={2} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="saved-views-label">Saved Views</InputLabel>
            <Select
              labelId="saved-views-label"
              label="Saved Views"
              value={selectedViewId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedViewId(value);
              }}
              disabled={isLoadingViews}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {views.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.name}{v.isDefault ? ' • default' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="New view name"
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
          />
          <Button variant="outlined" size="small" onClick={handleSaveView}>
            Save View
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleApplyView(selectedViewId)}
          >
            Apply View
          </Button>
          {selectedViewId && (
            <>
              <Button variant="text" size="small" onClick={() => handleSetDefault(selectedViewId)}>Set Default</Button>
              <Button color="error" variant="text" size="small" onClick={() => handleDeleteView(selectedViewId)}>Delete</Button>
            </>
          )}
          {!selectedViewId && (
            <Button variant="text" size="small" onClick={async () => {
              try {
                await api.clearDefaultView(pageKey);
                setViews(prev => prev.map(v => ({ ...v, isDefault: false })));
              } catch (_) {}
            }}>Reset Default</Button>
          )}
        </Box>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <Box display="flex" gap={1} mb={2} flexWrap="wrap" alignItems="center">
          <Typography variant="body2" color="textSecondary">Active filters:</Typography>
          {Object.entries(searchState.filters).map(([fieldName, value]) => {
            const field = availableFields.find(f => f.name === fieldName);
            let displayValue = value;
            
            if (typeof value === 'object' && value !== null) {
              if (value.min !== undefined || value.max !== undefined) {
                const formatRange = (v) => {
                  if (v === undefined || v === null || v === '') return 'Any';
                  if (fieldName === 'cap_rate') return `${v}%`;
                  if (fieldName === 'price' || fieldName === 'price_per_ft') return formatCurrency(v, 2);
                  return v;
                };
                displayValue = `${formatRange(value.min)} - ${formatRange(value.max)}`;
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
                  {quickBooleanFieldsOrdered.map((field) => (
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
            {Object.entries(groupedFields)
              .filter(([groupName, fields]) => groupName !== 'Other' && (!Array.isArray(fields) || fields.length > 0))
              .map(([groupName, fields]) => (
              <Grid item xs={12} key={groupName}>
                 <Accordion defaultExpanded={groupName === 'Status Fields' || groupName === 'Boolean Fields'} sx={{ '& .MuiAccordionSummary-root': { minHeight: 32 }, '& .MuiAccordionSummary-content': { my: 0 } }}>
                   <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                     <Typography variant="caption">{groupName === 'Text Fields' ? 'Main' : groupName}</Typography>
                   </AccordionSummary>
                   <AccordionDetails sx={{ pt: groupName === 'Text Fields' ? 0.25 : 0.5 }}>
                    {groupName === 'Text Fields' ? (
                      <>
                        {(() => {
                          const metaTextNames = ['email_source', 'email_subject', 'user', 'procured', 'address_hash'];
                          const primaryFields = fields.filter(f => !metaTextNames.includes(f.name));
                          const metaFields = fields.filter(f => metaTextNames.includes(f.name));
                          return (
                            <>
                              {primaryFields.length > 0 && (
                                <Grid container spacing={1} sx={{ mb: metaFields.length > 0 ? 1 : 0 }}>
                                  {primaryFields.map((field) => (
                                    <Grid item xs={12} sm={6} md={4} key={field.name}>
                                      {renderFilterControl(field)}
                                    </Grid>
                                  ))}
                                </Grid>
                              )}
                              {metaFields.length > 0 && (
                                <>
                                  <Typography variant="overline" sx={{ display: 'block', mb: 0.5 }}>Email & Meta</Typography>
                                  <Grid container spacing={1}>
                                    {metaFields.map((field) => (
                                      <Grid item xs={12} sm={6} md={4} key={field.name}>
                                        {renderFilterControl(field)}
                                      </Grid>
                                    ))}
                                  </Grid>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <Grid container spacing={1}>
                        {fields.map(field => (
                          <Grid item xs={12} sm={6} md={4} key={field.name}>
                            {renderFilterControl(field)}
                          </Grid>
                        ))}
                      </Grid>
                    )}
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