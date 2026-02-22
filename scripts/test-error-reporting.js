/**
 * Integration test: POST one error report to /api/v1/errors and assert 201.
 * Run with backend available (e.g. php artisan serve).
 *
 * Usage (from project root):
 *   node scripts/test-error-reporting.js
 *
 * Uses EXPO_PUBLIC_API_BASE_URL from env or .env, default http://localhost:8000
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const text = fs.readFileSync(envPath, 'utf8');
  const out = {};
  text.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  });
  return out;
}

const env = loadEnv();
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const baseURL = BASE.replace(/\/$/, '');
const url = `${baseURL}/api/v1/errors`;

const payload = {
  error_type: 'unhandled_exception',
  error_message: 'Integration test error',
  stack_trace: ' at test (test-error-reporting.js:1:1)',
  device_info: { os: 'node', appVersion: '1.0.0' },
  app_version: '1.0.0',
  environment: 'test',
};

async function main() {
  console.log('POST', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (res.status === 201) {
      const data = JSON.parse(text || '{}');
      console.log('OK (201). Reported error id:', data.id);
      return 0;
    }
    console.error('Unexpected status:', res.status, text.slice(0, 300));
    return 1;
  } catch (e) {
    console.error('Request failed:', e.message);
    return 1;
  }
}

main().then((code) => process.exit(code));
