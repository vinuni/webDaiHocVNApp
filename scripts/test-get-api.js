#!/usr/bin/env node

/**
 * Test guest-accessible GET APIs and report status + turn-around time.
 * Run: npm run test:api-get
 * Or:  node scripts/test-get-api.js
 *
 * Uses EXPO_PUBLIC_API_BASE_URL from .env or env var; defaults to http://localhost:8000
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

/** Guest-accessible GET endpoints to test */
const GET_ENDPOINTS = [
  { path: '/api/v1/ping', name: 'ping', expectKeys: ['ok'] },
  { path: '/api/v1/home', name: 'home', expectKeys: ['mon_this'] },
  { path: '/api/v1/mon-thi', name: 'mon-thi', expectKeys: ['mon_this'] },
  { path: '/api/v1/mon-thi/2', name: 'mon-thi/{id}', expectKeys: ['mon_thi'] },
  { path: '/api/v1/hoc-phan?mon_thi=2', name: 'hoc-phan', expectKeys: [] },
  { path: '/api/v1/hoc-phan/1', name: 'hoc-phan/{id}', expectKeys: ['id', 'tenhocphan'] },
  { path: '/api/v1/search?q=toán', name: 'search', expectKeys: ['data'] },
  { path: '/api/v1/comments?commentable_type=App%5CDeThi&commentable_id=1', name: 'comments', expectKeys: ['data'] },
];

async function testEndpoint(endpoint) {
  const url = `${baseURL}${endpoint.path}`;
  const start = Date.now();
  let status = 0;
  let ok = false;
  let error = null;
  let body = null;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    status = res.status;
    ok = res.ok;
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  } catch (e) {
    error = e.message;
  }

  const elapsed = Date.now() - start;
  return { endpoint, url, status, ok, elapsed, error, body };
}

function hasExpectedKeys(body, expectKeys) {
  if (!body || typeof body !== 'object') return expectKeys.length === 0;
  for (const k of expectKeys) {
    if (!(k in body)) return false;
  }
  return true;
}

function formatMs(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

async function main() {
  console.log('\n========================================');
  console.log('GET API Test - Status & Turn-around Time');
  console.log('========================================\n');
  console.log(`Base URL: ${baseURL}\n`);

  const results = [];
  for (const ep of GET_ENDPOINTS) {
    const r = await testEndpoint(ep);
    results.push(r);
  }

  let passed = 0;
  let failed = 0;
  let totalMs = 0;
  const maxNameLen = Math.max(...results.map((r) => r.endpoint.name.length));

  for (const r of results) {
    const expectKeys = r.endpoint.expectKeys || [];
    const structureOk = hasExpectedKeys(r.body, expectKeys);
    const ok = r.ok && (expectKeys.length === 0 || structureOk);
    if (ok) passed++;
    else failed++;

    totalMs += r.elapsed;

    const status = ok ? 'PASS' : 'FAIL';
    const statusColor = ok ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    const name = r.endpoint.name.padEnd(maxNameLen);
    const elapsed = formatMs(r.elapsed).padStart(10);
    const statusCode = r.status ? r.status.toString() : 'ERR';

    if (r.error) {
      console.log(`${statusColor}${status}${reset}  ${name}  ${statusCode}  ${elapsed}  ${r.error}`);
    } else {
      const extra = !structureOk && expectKeys.length > 0 ? ' (missing keys)' : '';
      console.log(`${statusColor}${status}${reset}  ${name}  ${statusCode}  ${elapsed}${extra}`);
    }
  }

  console.log('\n----------------------------------------');
  console.log(`Total: ${passed} passed, ${failed} failed`);
  console.log(`Avg turn-around: ${formatMs(totalMs / results.length)}`);
  console.log(`Total turn-around: ${formatMs(totalMs)}`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
