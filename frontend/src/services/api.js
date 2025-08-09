import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3101/api';
const DEFAULT_LIST_LIMIT = Number(process.env.REACT_APP_LIST_LIMIT || 1000);

const client = axios.create({
  baseURL: API_BASE_URL,
  // Do not set a global Content-Type. Axios will set the correct header per request:
  // - application/json for JSON bodies
  // - multipart/form-data with boundary for FormData
});

// Auth token management
let authToken = localStorage.getItem('token') || null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => authToken;
export const isAuthenticated = () => Boolean(authToken);

// Attach token to requests
client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle 401 responses globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Broadcast logout event
      window.dispatchEvent(new Event('auth:logout'));
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

// Properties API
const normalizeListResponse = (data) => Array.isArray(data) ? data : (data?.items || []);

// Ensure every property object has a stable string id
const toClientProperty = (prop) => {
  if (!prop || typeof prop !== 'object') return prop;
  const idValue = prop.id || prop._id;
  return idValue ? { id: String(idValue), ...prop } : { ...prop };
};

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
};

export const getProperties = async (params = {}) => {
  // Ensure reasonable defaults for dashboard and client-side filtering
  const query = buildQuery({ page: params.page || 1, limit: params.limit || DEFAULT_LIST_LIMIT, ...params });
  const response = await client.get(`/properties${query}`);
  return normalizeListResponse(response.data);
};

export const getProperty = async (id) => {
  const response = await client.get(`/properties/${id}`);
  return toClientProperty(response.data);
};

export const addProperty = async (data) => {
  const response = await client.post(`/properties`, data);
  const payload = response.data;
  // Notify listeners (e.g., header counters) that properties changed
  try { window.dispatchEvent(new Event('property:updated')); } catch (_) {}
  return payload;
};

export const updateProperty = async (id, data) => {
  const response = await client.put(`/properties/${id}`, data);
  try { window.dispatchEvent(new Event('property:updated')); } catch (_) {}
  const updated = response.data?.property ? toClientProperty(response.data.property) : response.data;
  return { ...response.data, property: updated };
};

export const deleteProperty = async (id) => {
  const response = await client.delete(`/properties/${id}`);
  try { window.dispatchEvent(new Event('property:deleted')); } catch (_) {}
  return response.data;
};

// Upload API
export const uploadImages = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  // Do NOT set Content-Type manually so the browser adds the correct boundary
  const response = await client.post('/uploads/images', formData, {
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
  });
  return response.data?.urls || [];
};

// Email processing API (disabled/stub)
export const processEmails = async () => {
  // Backend endpoint was removed during MongoDB migration. Return a safe stub.
  return { success: true, message: 'Email processing is currently disabled.' };
};

// Property interaction API
export const toggleLike = async (id) => {
  // Fetch current to compute toggle
  const current = await client.get(`/properties/${id}`);
  const liked = !Boolean(current.data?.liked);
  const response = await client.put(`/properties/${id}`, { liked });
  return { ...toClientProperty(response.data.property), message: liked ? 'Property liked' : 'Like removed' };
};

export const toggleLove = async (id) => {
  const current = await client.get(`/properties/${id}`);
  const loved = !Boolean(current.data?.loved);
  const response = await client.put(`/properties/${id}`, { loved });
  return { ...toClientProperty(response.data.property), message: loved ? 'Property loved' : 'Love removed' };
};

export const toggleArchive = async (id) => {
  const current = await client.get(`/properties/${id}`);
  const archived = !Boolean(current.data?.archived);
  const response = await client.put(`/properties/${id}`, { archived });
  return { ...toClientProperty(response.data.property), message: archived ? 'Property archived' : 'Property unarchived' };
};

export const setRating = async (id, rating) => {
  const response = await client.put(`/properties/${id}`, { rating });
  return { ...toClientProperty(response.data.property), message: 'Rating updated' };
};

// Archived properties API
export const getArchivedProperties = async () => {
  const response = await client.get(`/properties${buildQuery({ archived: true, page: 1, limit: DEFAULT_LIST_LIMIT })}`);
  return normalizeListResponse(response.data);
};

export const getArchivedPropertiesCount = async () => {
  const archived = await getArchivedProperties();
  const count = Array.isArray(archived) ? archived.length : (archived?.count || 0);
  return { count };
};

// Pending review properties API
export const getPendingReviewProperties = async () => {
  // Include pending properties even if they are soft-deleted
  const response = await client.get('/properties/pending-review/all');
  return normalizeListResponse(response.data);
};

// Deleted properties API
export const getDeletedProperties = async () => {
  // Ask backend specifically for deleted
  const response = await client.get(`/properties${buildQuery({ deleted: true, page: 1, limit: DEFAULT_LIST_LIMIT })}`);
  return normalizeListResponse(response.data);
};

// Follow-up API
export const setFollowUp = async (id, daysFromNow) => {
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + Number(daysFromNow || 0));
  const payload = {
    followUpDate: target.toISOString(),
    followUpSet: now.toISOString(),
    lastFollowUpDate: null
  };
  const response = await client.put(`/properties/${id}`, payload);
  try { window.dispatchEvent(new Event('property:updated')); } catch (_) {}
  return { ...toClientProperty(response.data.property), message: 'Follow-up set' };
};

export const setFollowUpDate = async (id, isoDateString) => {
  const now = new Date();
  const payload = {
    followUpDate: new Date(isoDateString).toISOString(),
    followUpSet: now.toISOString(),
    lastFollowUpDate: null
  };
  const response = await client.put(`/properties/${id}`, payload);
  try { window.dispatchEvent(new Event('property:updated')); } catch (_) {}
  return { ...toClientProperty(response.data.property), message: 'Follow-up set' };
};

export const removeFollowUp = async (id) => {
  const payload = { followUpDate: null, lastFollowUpDate: null };
  const response = await client.put(`/properties/${id}`, payload);
  try { window.dispatchEvent(new Event('property:updated')); } catch (_) {}
  return { ...toClientProperty(response.data.property), message: 'Follow-up removed' };
};

export const markAsFollowedUp = async (id) => {
  const payload = { lastFollowUpDate: new Date().toISOString() };
  const response = await client.put(`/properties/${id}`, payload);
  try { window.dispatchEvent(new Event('property:updated')); } catch (_) {}
  return { ...toClientProperty(response.data.property), message: 'Marked as followed up' };
};

// Duplicate detection API
export const recheckDuplicates = async () => {
  // Not implemented server-side; return a friendly stub
  return { success: false, message: 'Duplicate recheck is currently unavailable.' };
};

// Deleted properties management (client expectations)
export const restoreProperty = async (id) => {
  const response = await client.put(`/properties/${id}`, { deleted: false });
  return { ...toClientProperty(response.data.property), message: 'Property restored' };
};

export const permanentlyDeleteProperty = async (id) => {
  const response = await client.delete(`/properties/${id}/permanent`);
  return response.data;
};

// Pending review actions (stubs)
export const approveDuplicate = async (duplicateId, originalId, promote = 'duplicate') => {
  const response = await client.post(`/properties/pending-review/${duplicateId}/approve`, { originalId, promote });
  try { window.dispatchEvent(new Event('property:updated')); } catch (_) {}
  return response.data;
};

export const rejectDuplicate = async (id) => {
  const response = await client.post(`/properties/pending-review/${id}/reject`);
  try { window.dispatchEvent(new Event('property:updated')); } catch (_) {}
  return response.data;
};

export const getOriginalProperty = async (duplicateId) => {
  // Step 1: fetch the duplicate to discover its original id
  const duplicateResponse = await client.get(`/properties/${duplicateId}`);
  const duplicate = duplicateResponse.data;

  const originalId = duplicate?.duplicate_of?._id || duplicate?.duplicate_of;
  if (!originalId) {
    throw new Error('Original property is not linked to this duplicate.');
  }

  // Step 2: fetch the original property
  const originalResponse = await client.get(`/properties/${originalId}`);
  return originalResponse.data;
};

// Follow-ups API (computed client-side from all properties)
export const fetchFollowUps = async () => {
  const properties = await getProperties();

  const now = new Date();
  // Normalize to end of today so anything earlier is considered due
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Include archived items in follow-ups, exclude only deleted
  const isEligible = (p) => !p.deleted;
  const hasFollowUp = (p) => Boolean(p.followUpDate);

  const followUpsDue = properties.filter(
    (p) => isEligible(p) && hasFollowUp(p) && new Date(p.followUpDate) <= endOfToday
  );
  const followUpsNotDue = properties.filter(
    (p) => isEligible(p) && hasFollowUp(p) && new Date(p.followUpDate) > endOfToday
  );

  return {
    followUpsDue,
    followUpsNotDue,
    counts: {
      due: followUpsDue.length,
      notDue: followUpsNotDue.length,
      total: followUpsDue.length + followUpsNotDue.length,
    },
  };
};

// Auth endpoints
export const login = (credentials) => client.post('/auth/login', credentials);
export const register = (userData) => client.post('/auth/register', userData);
export const logout = () => client.post('/auth/logout');
export const getCurrentUser = () => client.get('/auth/me');
export const updateProfileApi = (profileData) => client.put('/auth/profile', profileData);
export const changePasswordApi = (passwordData) => client.put('/auth/change-password', passwordData);
export const updateEmailConfigApi = (emailConfig) => client.put('/auth/email-config', emailConfig);

const apiService = {
  getProperties,
  getProperty,
  addProperty,
  updateProperty,
  deleteProperty,
  processEmails,
  toggleLike,
  toggleLove,
  toggleArchive,
  setRating,
  getArchivedProperties,
  getArchivedPropertiesCount,
  getPendingReviewProperties,
  getDeletedProperties,
  recheckDuplicates,
  setFollowUp,
  setFollowUpDate,
  removeFollowUp,
  markAsFollowedUp,
  // review & duplicates
  approveDuplicate,
  rejectDuplicate,
  getOriginalProperty,
  // deletion/restore helpers
  restoreProperty,
  permanentlyDeleteProperty,
  fetchFollowUps,
  // auth helpers for context
  setAuthToken,
  getAuthToken,
  isAuthenticated,
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile: updateProfileApi,
  changePassword: changePasswordApi,
  updateEmailConfig: updateEmailConfigApi,
  uploadImages,
};

export default apiService; 