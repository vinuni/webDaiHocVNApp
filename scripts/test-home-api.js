/**
 * Test GET /api/v1/home response. Run from project root.
 * Requires auth token (get from app after login, or use a test user).
 *
 * Usage (PowerShell):
 *   $env:TOKEN="your-bearer-token"; node scripts/test-home-api.js
 * Or (cmd):
 *   set TOKEN=your-bearer-token && node scripts/test-home-api.js
 *
 * If .env exists, EXPO_PUBLIC_API_BASE_URL is used; else defaults to http://localhost:8000
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
const token = process.env.TOKEN;

const url = `${baseURL}/api/v1/home`;

async function main() {
  console.log('GET', url);
  if (!token) {
    console.log('No TOKEN set. Response will be 401 if the route requires auth.');
  }
  const headers = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    console.log('Status:', res.status);
    if (!res.ok) {
      console.log('Body:', text.slice(0, 500));
      return;
    }
    const data = JSON.parse(text);
    const monThis = data.mon_this ?? data.data?.mon_this ?? [];
    console.log('mon_this length:', Array.isArray(monThis) ? monThis.length : 'not an array');
    if (Array.isArray(monThis) && monThis.length > 0) {
      console.log('First subject:', monThis[0]);
    }
    console.log('Keys in response:', Object.keys(data));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
