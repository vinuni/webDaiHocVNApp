/**
 * API client for Laravel /api/v1.
 * Base URL from .env EXPO_PUBLIC_API_BASE_URL.
 * Sends Bearer token from authStorage when present.
 * For guest users: GET requests that fail with 401 will not clear session.
 * For authenticated users: 401 on any request clears session.
 */

import { authStorage } from '../auth/storage';
import { clearSession } from '../auth/sessionManager';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const baseURL = BASE.replace(/\/$/, '');

export const apiClient = {
  baseURL,

  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${baseURL}${path.startsWith('/') ? path : '/' + path}`;
    const token = await authStorage.getToken();
    const isGuest = !token;
    
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    
    // Debug logging in development
    if (__DEV__) {
      console.log(`[API] ${options.method || 'GET'} ${url}`);
      if (options.body) {
        console.log('[API] Body:', options.body);
      }
    }
    
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    
    if (__DEV__) {
      console.log(`[API] Response ${res.status}:`, text.substring(0, 200));
    }
    
    if (!res.ok) {
      if (res.status === 401) {
        // Only clear session if user was authenticated (not a guest)
        // OR if it's a non-GET request (POST, PUT, etc.)
        const method = (options.method || 'GET').toUpperCase();
        if (!isGuest || method !== 'GET') {
          await clearSession();
        }
      }
      const err = new Error(text || `HTTP ${res.status}`);
      err.status = res.status;
      try {
        err.body = text ? JSON.parse(text) : null;
      } catch {
        err.body = null;
      }
      throw err;
    }
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  },

  get(path) {
    return this.request(path, { method: 'GET' });
  },

  post(path, body) {
    return this.request(path, {
      method: 'POST',
      body: typeof body === 'object' ? JSON.stringify(body) : body,
    });
  },

  put(path, body) {
    return this.request(path, {
      method: 'PUT',
      body: typeof body === 'object' ? JSON.stringify(body) : body,
    });
  },

  /**
   * POST multipart/form-data (e.g. for ai-question with photo).
   * Do not set Content-Type so the browser sets boundary.
   */
  async postFormData(path, formData) {
    const url = path.startsWith('http') ? path : `${baseURL}${path.startsWith('/') ? path : '/' + path}`;
    const token = await authStorage.getToken();
    const headers = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(url, { method: 'POST', headers, body: formData });
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 401) await clearSession();
      const err = new Error(text || `HTTP ${res.status}`);
      err.status = res.status;
      try {
        err.body = text ? JSON.parse(text) : null;
      } catch {
        err.body = null;
      }
      throw err;
    }
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  },
};

export default apiClient;
