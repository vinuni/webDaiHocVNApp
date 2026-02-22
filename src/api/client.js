/**
 * API client for Laravel /api/v1.
 * Base URL from .env EXPO_PUBLIC_API_BASE_URL.
 * Sends Bearer token from authStorage when present.
 * For guest users: GET requests that fail with 401 will not clear session.
 * For authenticated users: 401 on any request clears session.
 * Failed requests are reported to the error reporting endpoint (except errors from that endpoint).
 */

import { authStorage } from '../auth/storage';
import { clearSession } from '../auth/sessionManager';
import { reportApiError } from '../utils/errorReporter';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const baseURL = BASE.replace(/\/$/, '');

export const apiClient = {
  baseURL,

  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${baseURL}${path.startsWith('/') ? path : '/' + path}`;
    const token = await authStorage.getToken();
    const isGuest = !token;
    const method = (options.method || 'GET').toUpperCase();

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Debug logging in development
    if (__DEV__) {
      console.log(`[API] ${method} ${url}`);
      if (options.body) {
        console.log('[API] Body:', options.body);
      }
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const text = await res.text();

      if (__DEV__) {
        console.log(`[API] Response ${res.status}:`, text.substring(0, 200));
      }

      if (!res.ok) {
        if (res.status === 401) {
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
        reportApiError(err, { url, method }, { status: res.status, body: text });
        throw err;
      }
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    } catch (err) {
      // Report only network/fetch failures here; HTTP error responses already reported above
      if (err.status === undefined) {
        reportApiError(err, { url, method: method || 'GET' }, { status: 0, body: err.message });
      }
      throw err;
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
    try {
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
        reportApiError(err, { url, method: 'POST' }, { status: res.status, body: text });
        throw err;
      }
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    } catch (err) {
      if (err.status === undefined) {
        reportApiError(err, { url, method: 'POST' }, { status: 0, body: err.message });
      }
      throw err;
    }
  },
};

export default apiClient;
