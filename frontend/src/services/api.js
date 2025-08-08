import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3101/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
export const getProperties = async () => {
  const response = await client.get('/properties');
  return response.data;
};

export const getProperty = async (id) => {
  const response = await client.get(`/properties/${id}`);
  return response.data;
};

export const updateProperty = async (id, data) => {
  const response = await client.put(`/properties/${id}`, data);
  return response.data;
};

export const deleteProperty = async (id) => {
  const response = await client.delete(`/properties/${id}`);
  return response.data;
};

// Email processing API
export const processEmails = async () => {
  const response = await client.post('/process-emails');
  return response.data;
};

// Property interaction API
export const toggleLike = async (id) => {
  const response = await client.post(`/properties/${id}/like`);
  return response.data;
};

export const toggleLove = async (id) => {
  const response = await client.post(`/properties/${id}/love`);
  return response.data;
};

export const toggleArchive = async (id) => {
  const response = await client.post(`/properties/${id}/archive`);
  return response.data;
};

export const setRating = async (id, rating) => {
  const response = await client.post(`/properties/${id}/rating`, { rating });
  return response.data;
};

// Archived properties API
export const getArchivedProperties = async () => {
  const response = await client.get('/properties?archived=true');
  return response.data;
};

export const getArchivedPropertiesCount = async () => {
  const response = await client.get('/properties/archived/count');
  return response.data;
};

// Pending review properties API
export const getPendingReviewProperties = async () => {
  const response = await client.get('/properties?status=pending-review');
  return response.data;
};

// Deleted properties API
export const getDeletedProperties = async () => {
  const response = await client.get('/properties?status=deleted');
  return response.data;
};

// Duplicate detection API
export const recheckDuplicates = async () => {
  const response = await client.post('/properties/recheck-duplicates');
  return response.data;
};

// Follow-ups API (computed client-side from all properties)
export const fetchFollowUps = async () => {
  const response = await client.get('/properties');
  const properties = Array.isArray(response.data) ? response.data : [];

  const now = new Date();
  // Normalize to end of today so anything earlier is considered due
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const isActive = (p) => !p.archived && !p.deleted;
  const hasFollowUp = (p) => Boolean(p.followUpDate);

  const followUpsDue = properties.filter(
    (p) => isActive(p) && hasFollowUp(p) && new Date(p.followUpDate) <= endOfToday
  );
  const followUpsNotDue = properties.filter(
    (p) => isActive(p) && hasFollowUp(p) && new Date(p.followUpDate) > endOfToday
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
};

export default apiService; 