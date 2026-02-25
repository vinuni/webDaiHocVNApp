/**
 * API client for Laravel /api/v1.
 * Base URL from .env EXPO_PUBLIC_API_BASE_URL.
 * Sends Bearer token from authStorage when present.
 * For guest users: GET requests that fail with 401 will not clear session.
 * For authenticated users: 401 on any request triggers auto-reauth attempt, then clears session if it fails.
 * Failed requests are reported to the error reporting endpoint (except errors from that endpoint).
 */

import { authStorage } from '../auth/storage';
import { clearSession } from '../auth/sessionManager';
import { reportApiError } from '../utils/errorReporter';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const baseURL = BASE.replace(/\/$/, '');

let isReauthenticating = false; // Prevent multiple simultaneous reauth attempts

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
      console.log(`[API] ${method} ${url} ${token ? '(with auth)' : '(no auth)'}`);
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
          // Token expired or invalid
          if (!isGuest && !isReauthenticating) {
            // Try auto-reauth with saved credentials
            const credentials = await authStorage.getCredentials();
            if (credentials && credentials.email && credentials.password) {
              isReauthenticating = true;
              try {
                if (__DEV__) {
                  console.log('[API] 401 detected, attempting auto-reauth');
                }
                const loginRes = await fetch(`${baseURL}/api/v1/login`, {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                  }),
                });
                const loginText = await loginRes.text();
                if (loginRes.ok) {
                  const loginData = JSON.parse(loginText);
                  const newToken = loginData.token;
                  const newUser = loginData.user;
                  await authStorage.setToken(newToken);
                  await authStorage.setUser(newUser);
                  
                  if (__DEV__) {
                    console.log('[API] Auto-reauth successful, retrying original request');
                  }
                  
                  // Retry the original request with new token
                  const retryHeaders = {
                    ...headers,
                    Authorization: `Bearer ${newToken}`,
                  };
                  const retryRes = await fetch(url, { ...options, headers: retryHeaders });
                  const retryText = await retryRes.text();
                  
                  if (retryRes.ok) {
                    isReauthenticating = false;
                    try {
                      return retryText ? JSON.parse(retryText) : null;
                    } catch {
                      return null;
                    }
                  }
                  // Retry also failed, fall through to clear session
                }
                // Auto-reauth failed
                if (__DEV__) {
                  console.log('[API] Auto-reauth failed');
                }
              } catch (reauthErr) {
                if (__DEV__) {
                  console.log('[API] Auto-reauth error:', reauthErr.message);
                }
              } finally {
                isReauthenticating = false;
              }
            }
          }
          
          // Clear session only for authenticated users or non-GET requests
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

  /**
   * Fetch all completed exam IDs and scores for the current user (auth required).
   * Returns Map<de_thi_id, diem>. Use as fallback to mark exams done on HomeScreen/MonThiScreen.
   */
  async getCompletedExams() {
    try {
      const res = await this.get('/api/v1/user/completed-exams');
      const list = res?.completed ?? [];
      return new Map(
        (Array.isArray(list) ? list : []).map(({ de_thi_id, diem }) => [de_thi_id, diem])
      );
    } catch {
      return new Map();
    }
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
