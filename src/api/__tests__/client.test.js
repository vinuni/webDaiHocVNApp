/**
 * API client: request URL building, 401 clears session
 */
import { apiClient } from '../client';

const mockClearSession = jest.fn(() => Promise.resolve());
jest.mock('../../auth/storage', () => ({
  authStorage: {
    getToken: jest.fn(() => Promise.resolve('fake-token')),
    getUser: jest.fn(() => Promise.resolve(null)),
  },
}));
jest.mock('../../auth/sessionManager', () => ({
  clearSession: (...args) => mockClearSession(...args),
}));
jest.mock('../../utils/errorReporter', () => ({
  reportApiError: jest.fn(),
}));

const { authStorage } = require('../../auth/storage');

const originalFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  authStorage.getToken.mockResolvedValue('fake-token');
});
afterAll(() => {
  global.fetch = originalFetch;
});

describe('apiClient', () => {
  it('has baseURL', () => {
    expect(apiClient.baseURL).toBeDefined();
    expect(typeof apiClient.baseURL).toBe('string');
  });

  describe('get', () => {
    it('builds URL from baseURL and path', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('{"x":1}'),
      });
      await apiClient.get('/api/v1/ping');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ping'),
        expect.objectContaining({ method: 'GET', headers: expect.any(Object) })
      );
    });

    it('sends Authorization header when token exists', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('{}'),
      });
      await apiClient.get('/api/v1/user');
      const call = global.fetch.mock.calls[0];
      expect(call[1].headers.Authorization).toBe('Bearer fake-token');
    });

    it('returns parsed JSON on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('{"foo":"bar"}'),
      });
      const res = await apiClient.get('/api/v1/ping');
      expect(res).toEqual({ foo: 'bar' });
    });

    it('on 401 calls clearSession and throws', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthenticated'),
      });
      await expect(apiClient.get('/api/v1/home')).rejects.toThrow();
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });

    it('on 404 throws without calling clearSession', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not found'),
      });
      await expect(apiClient.get('/api/v1/unknown')).rejects.toThrow();
      expect(mockClearSession).not.toHaveBeenCalled();
    });
  });
});
