/**
 * Session manager: setOnUnauthorized and clearSession
 */
import { setOnUnauthorized, clearSession } from '../sessionManager';

jest.mock('../storage', () => ({
  authStorage: {
    clear: jest.fn(() => Promise.resolve()),
  },
}));

const { authStorage } = require('../storage');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('sessionManager', () => {
  describe('setOnUnauthorized', () => {
    it('registers a callback', () => {
      const fn = jest.fn();
      setOnUnauthorized(fn);
      expect(() => setOnUnauthorized(null)).not.toThrow();
    });
  });

  describe('clearSession', () => {
    it('calls authStorage.clear', async () => {
      await clearSession();
      expect(authStorage.clear).toHaveBeenCalledTimes(1);
    });

    it('invokes the registered onUnauthorized callback', async () => {
      const cb = jest.fn();
      setOnUnauthorized(cb);
      await clearSession();
      expect(cb).toHaveBeenCalledTimes(1);
      setOnUnauthorized(null);
    });

    it('does not throw when no callback is registered', async () => {
      setOnUnauthorized(null);
      await expect(clearSession()).resolves.toBeUndefined();
    });
  });
});
