// Centralized Property Field Schema
// Defines labels, types, options, defaults, and visibility across contexts

export const PROPERTY_CONTEXTS = {
  CREATE: 'create',
  EDIT: 'edit',
  VIEW: 'view',
  SEARCH: 'search',
};

// Ordered sections to control grouping in forms/views
export const PROPERTY_SECTIONS = {
  BASIC: 'Basic Information',
  DETAILS: 'Property Details',
  ADDITIONAL: 'Additional Information',
  IMAGES: 'Property Images',
  STATUS: 'Status',
};

const STATUS_OPTIONS = ['active', 'sold', 'pending'];
const PROPERTY_TYPES = [
  'Office',
  'Retail',
  'Industrial',
  'Medical',
  'Restaurant',
  'Mixed-Use',
  'Residential',
  'Warehouse',
  'Other',
];

// Field definitions
// type: text | numeric | boolean | enum | date | images | special
export const PROPERTY_FIELDS = [
  {
    name: 'title',
    label: 'Property Title',
    type: 'text',
    required: true,
    defaultValue: '',
    section: PROPERTY_SECTIONS.BASIC,
    showIn: { create: true, edit: true, view: true, search: true },
  },
  {
    name: 'location',
    label: 'Location/Address',
    type: 'text',
    required: true,
    defaultValue: '',
    section: PROPERTY_SECTIONS.BASIC,
    showIn: { create: true, edit: true, view: true, search: true },
    helperText: 'This is used for duplicate detection',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'text',
    required: true,
    defaultValue: '',
    section: PROPERTY_SECTIONS.BASIC,
    showIn: { create: true, edit: true, view: true, search: true },
    ui: { multiline: true, rows: 2 },
  },

  {
    name: 'price',
    label: 'Price',
    type: 'numeric',
    defaultValue: '',
    section: PROPERTY_SECTIONS.DETAILS,
    showIn: { create: true, edit: true, view: true, search: true },
    placeholder: 'e.g., $15,000/month',
  },
  {
    name: 'property_type',
    label: 'Property Type',
    type: 'enum',
    options: PROPERTY_TYPES,
    defaultValue: '',
    section: PROPERTY_SECTIONS.DETAILS,
    showIn: { create: true, edit: true, view: true, search: true },
  },
  {
    name: 'square_feet',
    label: 'Square Feet',
    type: 'numeric',
    defaultValue: '',
    section: PROPERTY_SECTIONS.DETAILS,
    showIn: { create: true, edit: true, view: true, search: true },
    placeholder: 'e.g., 5,000',
  },
  {
    name: 'bedrooms',
    label: 'Bedrooms',
    type: 'numeric',
    defaultValue: '',
    section: PROPERTY_SECTIONS.DETAILS,
    showIn: { create: true, edit: true, view: true, search: true },
    placeholder: 'e.g., 3 or N/A',
  },
  {
    name: 'bathrooms',
    label: 'Bathrooms',
    type: 'numeric',
    defaultValue: '',
    section: PROPERTY_SECTIONS.DETAILS,
    showIn: { create: true, edit: true, view: true, search: true },
    placeholder: 'e.g., 2',
  },

  {
    name: 'status',
    label: 'Status',
    type: 'enum',
    options: STATUS_OPTIONS,
    defaultValue: 'active',
    section: PROPERTY_SECTIONS.STATUS,
    showIn: { create: false, edit: true, view: true, search: true },
  },

  {
    name: 'property_url',
    label: 'Property URL',
    type: 'text',
    defaultValue: '',
    section: PROPERTY_SECTIONS.ADDITIONAL,
    showIn: { create: true, edit: true, view: true, search: true },
    placeholder: 'https://example.com/property',
  },
  {
    name: 'email_source',
    label: 'Email Source',
    type: 'text',
    defaultValue: '',
    section: PROPERTY_SECTIONS.ADDITIONAL,
    showIn: { create: true, edit: true, view: true, search: true },
  },
  {
    name: 'email_subject',
    label: 'Email Subject',
    type: 'text',
    defaultValue: '',
    section: PROPERTY_SECTIONS.ADDITIONAL,
    showIn: { create: true, edit: true, view: true, search: true },
  },
  {
    name: 'email_date',
    label: 'Date Received',
    type: 'date',
    defaultValue: null,
    section: PROPERTY_SECTIONS.ADDITIONAL,
    showIn: { create: false, edit: false, view: true, search: true },
  },

  {
    name: 'images',
    label: 'Property Images',
    type: 'images',
    defaultValue: [],
    section: PROPERTY_SECTIONS.IMAGES,
    showIn: { create: true, edit: true, view: true, search: false },
  },

  // Interaction/meta fields (view/search only)
  { name: 'liked', label: 'Liked', type: 'boolean', defaultValue: false, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'loved', label: 'Loved', type: 'boolean', defaultValue: false, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'archived', label: 'Archived', type: 'boolean', defaultValue: false, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'deleted', label: 'Deleted', type: 'boolean', defaultValue: false, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: false, search: true } },
  { name: 'rating', label: 'Rating', type: 'numeric', defaultValue: 0, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'followUpDate', label: 'Follow-up Date', type: 'date', defaultValue: null, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'followUpSet', label: 'Follow-up Set', type: 'date', defaultValue: null, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'lastFollowUpDate', label: 'Last Follow-up', type: 'date', defaultValue: null, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'duplicate_of', label: 'Duplicate Of', type: 'special', defaultValue: null, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'createdAt', label: 'Created At', type: 'date', defaultValue: null, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
  { name: 'updatedAt', label: 'Updated At', type: 'date', defaultValue: null, section: PROPERTY_SECTIONS.ADDITIONAL, showIn: { create: false, edit: false, view: true, search: true } },
];

export const PROPERTY_FIELDS_MAP = Object.fromEntries(
  PROPERTY_FIELDS.map((f) => [f.name, f])
);

export const getFieldsForContext = (context) => {
  const ctx = String(context || '').toLowerCase();
  return PROPERTY_FIELDS.filter((f) => f.showIn?.[ctx]);
};

export const getInitialFormData = (context = PROPERTY_CONTEXTS.CREATE) => {
  const fields = getFieldsForContext(context);
  const initial = {};
  fields.forEach((f) => {
    initial[f.name] = f.defaultValue;
  });
  // Ensure these exist even if not explicitly visible in context
  if (initial.email_source === undefined) initial.email_source = '';
  if (initial.email_subject === undefined) initial.email_subject = '';
  if (initial.status === undefined) initial.status = 'active';
  if (initial.images === undefined) initial.images = [];
  return initial;
};

export const getEnumOptions = (fieldName) => {
  return PROPERTY_FIELDS_MAP[fieldName]?.options || [];
};


