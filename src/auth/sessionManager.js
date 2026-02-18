/**
 * Handles session invalidation (e.g. 401 Unauthorized).
 * API client calls clearSession(); AuthProvider registers a callback to update state.
 * This avoids circular dependency between api/client and AuthContext.
 */

import { authStorage } from './storage';

let onUnauthorizedCallback = null;

/**
 * Register a callback to run when session is cleared (e.g. after 401).
 * Should clear auth state so the app shows login screen.
 * @param {() => void} fn
 */
export function setOnUnauthorized(fn) {
  onUnauthorizedCallback = fn;
}

/**
 * Clear stored auth and notify listener. Call this on 401 so the app switches to login.
 */
export async function clearSession() {
  await authStorage.clear();
  onUnauthorizedCallback?.();
}
