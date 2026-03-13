import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, CACHE_TTL } from '../constants/config';

// Create axios instance
const api = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// In-memory cache for token and URL — avoids AsyncStorage read on every request
let _cachedToken = null;
let _cachedUrl = null;

// Call this after login or store hydration to prime the cache
export const primeApiCache = (url, token) => {
  _cachedUrl = url;
  _cachedToken = token;
};

// Request interceptor: attach baseURL and auth token dynamically
api.interceptors.request.use(async (config) => {
  try {
    // Use memory cache first, fall back to AsyncStorage only if not primed
    let url = _cachedUrl;
    let token = _cachedToken;

    if (!url || !token) {
      const storeRaw = await AsyncStorage.getItem('assetflow-store-v1');
      if (storeRaw) {
        const store = JSON.parse(storeRaw);
        const state = store.state || store;
        url = url || state.backendUrl;
        token = token || state.token;
        // Prime cache for next time
        if (url) _cachedUrl = url;
        if (token) _cachedToken = token;
      }
    }

    if (url && !config.baseURL) config.baseURL = url;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // continue without modifying config
  }
  return config;
});

// Response interceptor: handle 401 token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._isHealthCheck) {
      try {
        const useAppStore = require('../store/useAppStore').default;
        const state = useAppStore.getState();
        if (state.token) {
          state.showToast('Session expired. Please log in again.', 'error');
          state.logout();
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

/**
 * Health check — treats 401 AND 403 as "server is reachable"
 * Only network error / timeout = unreachable
 */
export const checkHealth = async (url) => {
  if (!url) return false;
  try {
    await axios.get(`${url}/health`, {
      timeout: 8000,
      _isHealthCheck: true,
    });
    return true; // 200 shouldn't happen but means connected
  } catch (error) {
    if (error.response) {
      return true;
    }
    return false; // Network error, timeout, DNS failure = not reachable
  }
};

// ---- Cache Helpers ----
export const getCached = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { value, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return value;
  } catch {
    return null;
  }
};

export const setCache = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
  } catch {}
};

export const clearCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
};

// ---- Auth API ----
export const authApi = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
  changePassword: (oldPassword, newPassword) =>
    api.post('/api/auth/change-password', { oldPassword, newPassword }),
};

// ---- Dashboard API ----
export const dashboardApi = {
  stats: () => api.get('/api/dashboard/stats'),
};

// ---- Employees API ----
export const employeesApi = {
  list: () => api.get('/api/employees'),
  get: (id) => api.get(`/api/employees/${id}`),
  create: (data) => api.post('/api/employees', data),
  update: (id, data) => api.put(`/api/employees/${id}`, data),
  delete: (id) => api.delete(`/api/employees/${id}`),
};

// ---- Asset Types API ----
export const assetTypesApi = {
  list: () => api.get('/api/asset-types'),
  create: (data) => api.post('/api/asset-types', data),
  delete: (id) => api.delete(`/api/asset-types/${id}`),
};

// ---- Assets API ----
export const assetsApi = {
  list: () => api.get('/api/assets'),
  get: (id) => api.get(`/api/assets/${id}`),
  create: (data) => api.post('/api/assets', data),
  update: (id, data) => api.put(`/api/assets/${id}`, data),
  delete: (id) => api.delete(`/api/assets/${id}`),
  uploadImage: (formData) =>
    api.post('/api/assets/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ---- Transfers API ----
export const transfersApi = {
  list: () => api.get('/api/transfers'),
  assetTransfers: (assetId) => api.get(`/api/transfers/asset/${assetId}`),
  employeeTransfers: (employeeId) => api.get(`/api/transfers/employee/${employeeId}`),
  create: (data) => api.post('/api/transfers', data),
  delete: (id) => api.delete(`/api/transfers/${id}`),
};

// ---- Subscriptions API ----
export const subscriptionsApi = {
  list: () => api.get('/api/subscriptions'),
  get: (id) => api.get(`/api/subscriptions/${id}`),
  create: (data) => api.post('/api/subscriptions', data),
  update: (id, data) => api.put(`/api/subscriptions/${id}`, data),
  delete: (id) => api.delete(`/api/subscriptions/${id}`),
  fetchLogo: (url) => api.post('/api/subscriptions/fetch-logo', { url }),
};

// ---- Settings API ----
export const settingsApi = {
  employeeFields: () => api.get('/api/settings/employee-fields'),
  branding: () => api.get('/api/settings/branding'),
  app: () => api.get('/api/settings/app'),
  datetime: () => api.get('/api/settings/datetime'),
  updateDatetime: (data) => api.put('/api/settings/datetime', data),
  assetFieldVisibility: () => api.get('/api/settings/asset-field-visibility'),
  storageStats: () => api.get('/api/clear/storage-stats'),
};

// ---- Users API ----
export const usersApi = {
  list: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
};

// ---- Files API ----
export const getFileUrl = (backendUrl, fileId) =>
  fileId ? `${backendUrl}/api/files/${fileId}` : null;

export default api;

// ---- Asset Fields API (added) ----
// Patch assetTypesApi to include field endpoints
const _origAssetTypesApi = { ...assetTypesApi };
Object.assign(assetTypesApi, {
  update: (id, data) => api.put(`/api/asset-types/${id}`, data),
  createField: (typeId, data) => api.post(`/api/asset-types/${typeId}/fields`, data),
  updateField: (typeId, fieldId, data) => api.put(`/api/asset-types/${typeId}/fields/${fieldId}`, data),
  deleteField: (typeId, fieldId) => api.delete(`/api/asset-types/${typeId}/fields/${fieldId}`),
});

// ---- Employee Fields Settings (added) ----
Object.assign(settingsApi, {
  updateEmployeeFields: (fields) => api.put('/api/settings/employee-fields', fields),
});
