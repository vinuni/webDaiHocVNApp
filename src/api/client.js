/**
 * API client for Laravel /api/v1.
 * Base URL from .env EXPO_PUBLIC_API_BASE_URL.
 */

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const baseURL = BASE.replace(/\/$/, '');

export const apiClient = {
  baseURL,

  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${baseURL}${path.startsWith('/') ? path : '/' + path}`;
    const headers = {
      Accept: 'application/json',
      ...(options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(text || `HTTP ${res.status}`);
      err.status = res.status;
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
};

export default apiClient;
