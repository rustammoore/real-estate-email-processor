import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Properties API
export const getProperties = async () => {
  const response = await api.get('/properties');
  return response.data;
};

export const getProperty = async (id) => {
  const response = await api.get(`/properties/${id}`);
  return response.data;
};

export const updateProperty = async (id, data) => {
  const response = await api.put(`/properties/${id}`, data);
  return response.data;
};

export const deleteProperty = async (id) => {
  const response = await api.delete(`/properties/${id}`);
  return response.data;
};

// Email processing API
export const processEmails = async () => {
  const response = await api.post('/process-emails');
  return response.data;
};

export default {
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  processEmails,
}; 