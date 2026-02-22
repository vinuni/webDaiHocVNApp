/**
 * Error reporting: collect device/app context and send to backend /api/v1/errors.
 * Rate-limited; does not report failures from the errors endpoint itself.
 */

import { Platform, Dimensions } from 'react-native';
import { authStorage } from '../auth/storage';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const baseURL = BASE.replace(/\/$/, '');
const ERRORS_ENDPOINT = '/api/v1/errors';
const REPORT_URL = `${baseURL}${ERRORS_ENDPOINT}`;

const ENABLED = process.env.EXPO_PUBLIC_ERROR_REPORTING_ENABLED !== 'false';
const SAMPLE_RATE = parseFloat(process.env.EXPO_PUBLIC_ERROR_SAMPLE_RATE || '1', 10) || 1;
const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const recentTimestamps = [];
let isReporting = false;

function getAppVersion() {
  try {
    const app = require('../../app.json');
    return app?.expo?.version || app?.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function getDeviceInfo() {
  const { width, height } = Dimensions.get('window');
  return {
    os: Platform.OS,
    osVersion: Platform.Version != null ? String(Platform.Version) : undefined,
    screenWidth: width,
    screenHeight: height,
    appVersion: getAppVersion(),
  };
}

function isErrorsEndpoint(url) {
  if (!url) return false;
  const u = url.replace(/\/$/, '');
  return u === baseURL + ERRORS_ENDPOINT || u.endsWith(ERRORS_ENDPOINT);
}

function rateLimitPass() {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  while (recentTimestamps.length && recentTimestamps[0] < cutoff) {
    recentTimestamps.shift();
  }
  if (recentTimestamps.length >= RATE_LIMIT_COUNT) return false;
  recentTimestamps.push(now);
  return true;
}

function samplePass() {
  if (SAMPLE_RATE >= 1) return true;
  return Math.random() < SAMPLE_RATE;
}

/**
 * Send error report to backend. Uses fetch directly to avoid triggering API client interceptor.
 * Swallows errors to prevent infinite loops.
 */
async function sendReport(payload) {
  if (!ENABLED || !rateLimitPass() || !samplePass()) return;
  if (isReporting) return;
  isReporting = true;
  try {
    const token = await authStorage.getToken();
    const res = await fetch(REPORT_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok && __DEV__) {
      console.warn('[ErrorReporter] Server returned', res.status);
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[ErrorReporter] Failed to send report:', e?.message);
    }
  } finally {
    isReporting = false;
  }
}

/**
 * Report a generic error with optional context.
 * @param {Error|string} error - Error object or message
 * @param {Object} context - Optional: errorType, requestDetails, appState, componentStack
 */
export async function reportError(error, context = {}) {
  if (!ENABLED) return;
  const message = typeof error === 'string' ? error : (error?.message || String(error));
  const stack = typeof error === 'object' && error?.stack ? error.stack : null;
  const errorType = context.errorType || 'unhandled_exception';
  const user = await authStorage.getUser().catch(() => null);
  const payload = {
    error_type: errorType,
    error_message: message,
    stack_trace: stack || context.componentStack || null,
    device_info: getDeviceInfo(),
    app_state: context.appState || null,
    request_details: context.requestDetails || null,
    app_version: getAppVersion(),
    environment: __DEV__ ? 'development' : 'production',
  };
  await sendReport(payload);
}

/**
 * Report an API error (call from API client for failed requests).
 */
export async function reportApiError(error, request = {}, response = {}) {
  if (!ENABLED || isErrorsEndpoint(request?.url)) return;
  const requestDetails = {
    url: request.url,
    method: request.method || 'GET',
    status: response.status,
    responseBody: typeof response.body === 'string'
      ? response.body.substring(0, 1024)
      : (response.body ? JSON.stringify(response.body).substring(0, 1024) : null),
  };
  await reportError(error, {
    errorType: response.status === 0 || error?.message?.includes('network') ? 'network_error' : 'api_error',
    requestDetails,
  });
}

/**
 * Report a crash / unhandled exception (used by global handler).
 */
export function reportCrash(error, stack) {
  const message = error?.message || String(error);
  const stackTrace = stack || error?.stack || null;
  reportError(
    { message, stack: stackTrace },
    { errorType: 'crash', appState: null }
  );
}

/**
 * Install global error handler for unhandled JS errors.
 * Call once at app startup (e.g. in App.js or index.js).
 */
export function initGlobalErrorHandler() {
  if (typeof ErrorUtils === 'undefined') return;
  const original = ErrorUtils.getGlobalHandler?.();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    reportCrash(error, error?.stack);
    if (original) original(error, isFatal);
  });
}

export default {
  reportError,
  reportApiError,
  reportCrash,
  initGlobalErrorHandler,
  getDeviceInfo,
  isErrorsEndpoint,
};
