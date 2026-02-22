/**
 * Error reporter: device info, payload shape, endpoint, skip for errors URL
 */
const mockFetch = jest.fn();
const mockGetToken = jest.fn(() => Promise.resolve(null));
const mockGetUser = jest.fn(() => Promise.resolve(null));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', Version: '15' },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
}));
jest.mock('../../auth/storage', () => ({
  authStorage: {
    getToken: (...args) => mockGetToken(...args),
    getUser: (...args) => mockGetUser(...args),
  },
}));

jest.mock('../../../app.json', () => ({ expo: { version: '1.0.0' }, version: '1.0.0' }));

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch;
  mockFetch.mockResolvedValue({ ok: true });
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8000';
  process.env.EXPO_PUBLIC_ERROR_REPORTING_ENABLED = 'true';
  process.env.EXPO_PUBLIC_ERROR_SAMPLE_RATE = '1';
});

describe('errorReporter', () => {
  const mod = require('../errorReporter');
  const reporter = mod.default || mod;
  const { getDeviceInfo, isErrorsEndpoint, reportError, reportApiError } = reporter;

  describe('getDeviceInfo', () => {
    it('returns os, osVersion, screen dimensions and appVersion', () => {
      const info = getDeviceInfo();
      expect(info).toMatchObject({
        os: 'ios',
        osVersion: '15',
        screenWidth: 390,
        screenHeight: 844,
        appVersion: '1.0.0',
      });
    });
  });

  describe('isErrorsEndpoint', () => {
    it('returns true for URL ending with /api/v1/errors', () => {
      expect(isErrorsEndpoint('http://localhost:8000/api/v1/errors')).toBe(true);
      expect(isErrorsEndpoint('https://api.example.com/api/v1/errors')).toBe(true);
    });
    it('returns false for other URLs', () => {
      expect(isErrorsEndpoint('http://localhost:8000/api/v1/home')).toBe(false);
      expect(isErrorsEndpoint(null)).toBe(false);
    });
  });

  describe('reportError', () => {
    it('sends POST to /api/v1/errors with error_type and error_message', async () => {
      await reportError(new Error('test message'), { errorType: 'unhandled_exception' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/errors');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.error_type).toBe('unhandled_exception');
      expect(body.error_message).toBe('test message');
      expect(body.device_info).toBeDefined();
      expect(body.app_version).toBeDefined();
    });

    it('includes stack_trace when error has stack', async () => {
      const err = new Error('fail');
      await reportError(err);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stack_trace).toBeTruthy();
    });
  });

  describe('reportApiError', () => {
    it('does not call fetch when URL is the errors endpoint', async () => {
      const base = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      await reportApiError(
        new Error('fail'),
        { url: `${base}/api/v1/errors`, method: 'POST' },
        { status: 500, body: 'x' }
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sends report for non-errors URL', async () => {
      await reportApiError(
        new Error('HTTP 500'),
        { url: 'http://localhost:8000/api/v1/home', method: 'GET' },
        { status: 500, body: 'Server Error' }
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.error_type).toBe('api_error');
      expect(body.request_details).toMatchObject({ url: expect.any(String), method: 'GET', status: 500 });
    });
  });
});
