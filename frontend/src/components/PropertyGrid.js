import React from 'react';
import { useSearch } from '../contexts/SearchContext';
import PropertyCard from './PropertyCard';

function PropertyGrid({ 
  properties, 
  onDelete = null, 
  customActions = null,
  emptyMessage = "No properties found",
  loading = false,
  compact = false,
  variant = 'default',
  onPropertyUpdate = null,
  showFollowUpBadge = true,
  onFollowUpSet = null,
  onFollowUpRemoved = null,
  onUpdate = null,
  // Bulk selection mode controls
  selectMode = false,
  selectedIds = new Set(),
  onToggleSelect = null,
  pageKey = 'default'
}) {
  const { getSearchState, getFieldType, getAvailableFields } = useSearch();
  const searchState = getSearchState(pageKey);
  const availableFields = getAvailableFields(pageKey);

  const groupBy = searchState?.groupBy;

  const grouped = React.useMemo(() => {
    if (!groupBy || !groupBy.field) return null;
    const fieldName = groupBy.field;
    const order = groupBy.order === 'asc' ? 'asc' : 'desc';
    const interval = groupBy.interval || '';

    const fieldMeta = availableFields.find(f => f.name === fieldName);
    const fieldType = fieldMeta?.type || getFieldType(fieldName, properties?.[0]?.[fieldName]);

    const groupsMap = new Map();

    const toStartOfWeek = (d) => {
      const date = new Date(d);
      const day = date.getDay(); // 0 Sun .. 6 Sat
      const diff = (day === 0 ? -6 : 1) - day; // move to Monday
      const monday = new Date(date);
      monday.setDate(date.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const getQuarter = (date) => Math.floor(date.getMonth() / 3) + 1;

    const makeDateDescriptor = (value) => {
      if (!value) return { key: '__unspecified__', sortValue: -Infinity, label: 'Unspecified' };
      const date = new Date(value);
      if (isNaN(date.getTime())) return { key: '__unspecified__', sortValue: -Infinity, label: 'Unspecified' };
      let start, key, label;
      switch (interval) {
        case 'day': {
          start = new Date(date);
          start.setHours(0, 0, 0, 0);
          key = start.toISOString().slice(0, 10);
          label = start.toLocaleDateString();
          break;
        }
        case 'week': {
          start = toStartOfWeek(date);
          key = `week:${start.toISOString().slice(0, 10)}`;
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          label = `Week of ${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
          break;
        }
        case 'month': {
          start = new Date(date.getFullYear(), date.getMonth(), 1);
          key = `month:${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
          label = start.toLocaleString('default', { month: 'short', year: 'numeric' });
          break;
        }
        case 'quarter': {
          const q = getQuarter(date);
          start = new Date(date.getFullYear(), (q - 1) * 3, 1);
          key = `quarter:${start.getFullYear()}-Q${q}`;
          label = `Q${q} ${start.getFullYear()}`;
          break;
        }
        case 'year': {
          start = new Date(date.getFullYear(), 0, 1);
          key = `year:${start.getFullYear()}`;
          label = `${start.getFullYear()}`;
          break;
        }
        default: {
          // Auto: day for exact date-only strings, month otherwise
          start = new Date(date.getFullYear(), date.getMonth(), 1);
          key = `month:${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
          label = start.toLocaleString('default', { month: 'short', year: 'numeric' });
        }
      }
      return { key, sortValue: start.getTime(), label };
    };

    const makeDescriptor = (prop) => {
      const value = prop?.[fieldName];
      if (fieldType === 'date') {
        return makeDateDescriptor(value);
      }
      // Non-date
      if (value === undefined || value === null || value === '') {
        return { key: '__unspecified__', sortValue: Number.NEGATIVE_INFINITY, label: 'Unspecified' };
      }
      if (typeof value === 'number') {
        return { key: String(value), sortValue: value, label: String(value) };
      }
      if (typeof value === 'boolean') {
        return { key: String(value), sortValue: value ? 1 : 0, label: value ? 'Yes' : 'No' };
      }
      const text = String(value);
      return { key: text, sortValue: text.toLowerCase().charCodeAt(0), label: text };
    };

    for (const prop of properties) {
      const desc = makeDescriptor(prop);
      if (!groupsMap.has(desc.key)) {
        groupsMap.set(desc.key, { label: desc.label, sortValue: desc.sortValue, items: [] });
      }
      groupsMap.get(desc.key).items.push(prop);
    }

    // Sort groups by sortValue
    const entries = Array.from(groupsMap.entries()).map(([key, group]) => ({ key, ...group }));
    entries.sort((a, b) => (order === 'asc' ? (a.sortValue - b.sortValue) : (b.sortValue - a.sortValue)));
    return entries;
  }, [groupBy, properties, availableFields, getFieldType]);
  if (loading) {
    return (
      <div className="text-center mt-8">
        <p className="text-gray-600">Loading properties...</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center mt-8">
        <h3 className="text-lg font-medium text-gray-500">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  if (!grouped) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {properties.map((property) => (
          <PropertyCard 
            key={property.id}
            property={property}
            showActions={true}
            onDelete={onDelete}
            customActions={customActions ? customActions(property) : null}
            compact={compact}
            variant={variant}
            onPropertyUpdate={onPropertyUpdate}
            showFollowUpBadge={showFollowUpBadge}
            onFollowUpSet={onFollowUpSet}
            onFollowUpRemoved={onFollowUpRemoved}
            onUpdate={onUpdate}
            selectMode={selectMode}
            isSelected={selectedIds instanceof Set ? selectedIds.has(property.id) : Boolean(selectedIds?.includes?.(property.id))}
            onSelectToggle={onToggleSelect ? () => onToggleSelect(property.id) : null}
          />
        ))}
      </div>
    );
  }

  const groupFieldLabel = availableFields.find(f => f.name === groupBy.field)?.label || groupBy.field;

  return (
    <div className="mt-4">
      {grouped.map((group) => (
        <div key={group.key} className="mt-6">
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 py-1 mb-2 px-1">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold text-gray-800">{groupFieldLabel}: {group.label}</h3>
              <span className="text-xs text-gray-500">{group.items.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.items.map((property) => (
              <PropertyCard 
                key={property.id}
                property={property}
                showActions={true}
                onDelete={onDelete}
                customActions={customActions ? customActions(property) : null}
                compact={compact}
                variant={variant}
                onPropertyUpdate={onPropertyUpdate}
                showFollowUpBadge={showFollowUpBadge}
                onFollowUpSet={onFollowUpSet}
                onFollowUpRemoved={onFollowUpRemoved}
                onUpdate={onUpdate}
                selectMode={selectMode}
                isSelected={selectedIds instanceof Set ? selectedIds.has(property.id) : Boolean(selectedIds?.includes?.(property.id))}
                onSelectToggle={onToggleSelect ? () => onToggleSelect(property.id) : null}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PropertyGrid; 