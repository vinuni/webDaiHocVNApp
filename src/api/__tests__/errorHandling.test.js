/**
 * Error Handling Tests
 * Tests all error codes and status codes are handled correctly
 */

import { apiClient, ERROR_CODES } from '../client';

const mockClearSession = jest.fn(() => Promise.resolve());
jest.mock('../../auth/storage', () => ({
  authStorage: {
    getToken: jest.fn(() => Promise.resolve('fake-token')),
    setToken: jest.fn(() => Promise.resolve()),
    getUser: jest.fn(() => Promise.resolve(null)),
    setUser: jest.fn(() => Promise.resolve()),
    getCredentials: jest.fn(() => Promise.resolve(null)),
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
  authStorage.getCredentials.mockResolvedValue(null);
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('Error Code Handling', () => {
  describe('EXAM_COMPLETED (403)', () => {
    it('handles EXAM_COMPLETED error correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Bạn đã hoàn thành đề thi này',
          code: ERROR_CODES.EXAM_COMPLETED,
          redirect: 'ket_qua',
          dethi_id: 123,
          user_diem: 7.5,
        })),
      });

      try {
        await apiClient.get('/api/v1/de-thi/123/lam-bai');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(403);
        expect(e.body.code).toBe(ERROR_CODES.EXAM_COMPLETED);
        expect(e.body.redirect).toBe('ket_qua');
        expect(e.body.dethi_id).toBe(123);
        expect(e.body.user_diem).toBe(7.5);
        expect(typeof e.body.message).toBe('string');
      }
    });

    it('EXAM_COMPLETED error includes all required fields', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Exam completed',
          code: ERROR_CODES.EXAM_COMPLETED,
          redirect: 'ket_qua',
          dethi_id: 456,
          user_diem: 8.0,
        })),
      });

      try {
        await apiClient.post('/api/v1/de-thi/456/nop-bai', { answers: [] });
        fail('Should have thrown');
      } catch (e) {
        expect(e.body).toHaveProperty('code');
        expect(e.body).toHaveProperty('redirect');
        expect(e.body).toHaveProperty('dethi_id');
        expect(e.body).toHaveProperty('user_diem');
        expect(e.body).toHaveProperty('message');
      }
    });

    it('error body is parsable as JSON', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Completed',
          code: ERROR_CODES.EXAM_COMPLETED,
          redirect: 'ket_qua',
          dethi_id: 789,
          user_diem: 6.5,
        })),
      });

      try {
        await apiClient.get('/api/v1/de-thi/789/lam-bai');
        fail('Should have thrown');
      } catch (e) {
        expect(e.body).toBeDefined();
        expect(typeof e.body).toBe('object');
        expect(e.body.code).toBe(ERROR_CODES.EXAM_COMPLETED);
      }
    });
  });

  describe('LIMIT_REACHED (429)', () => {
    it('handles LIMIT_REACHED error correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Bạn đã đạt giới hạn số đề thi trong 24 giờ',
          code: ERROR_CODES.LIMIT_REACHED,
          limit: 10,
          retry_after: 3600,
        })),
      });

      try {
        await apiClient.post('/api/v1/de-thi/123/nop-bai', { answers: [] });
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(429);
        expect(e.body.code).toBe(ERROR_CODES.LIMIT_REACHED);
        expect(typeof e.body.message).toBe('string');
      }
    });

    it('LIMIT_REACHED includes rate limit info', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Rate limit exceeded',
          code: ERROR_CODES.LIMIT_REACHED,
          limit: 10,
          retry_after: 7200,
        })),
      });

      try {
        await apiClient.post('/api/v1/de-thi/999/nop-bai', { answers: [] });
        fail('Should have thrown');
      } catch (e) {
        expect(e.body).toHaveProperty('code');
        expect(e.body).toHaveProperty('message');
        expect(e.body.code).toBe(ERROR_CODES.LIMIT_REACHED);
      }
    });

    it('429 status code is correctly identified', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Too many requests',
          code: ERROR_CODES.LIMIT_REACHED,
        })),
      });

      try {
        await apiClient.get('/api/v1/de-thi/123/lam-bai');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(429);
      }
    });
  });

  describe('QUERY_REQUIRED (422)', () => {
    it('handles QUERY_REQUIRED error correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Vui lòng nhập từ khóa tìm kiếm',
          code: ERROR_CODES.QUERY_REQUIRED,
          errors: {
            q: ['The q field is required.'],
          },
        })),
      });

      try {
        await apiClient.get('/api/v1/search?q=');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(422);
        expect(e.body.code).toBe(ERROR_CODES.QUERY_REQUIRED);
        expect(typeof e.body.message).toBe('string');
      }
    });

    it('QUERY_REQUIRED includes validation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Validation failed',
          code: ERROR_CODES.QUERY_REQUIRED,
          errors: {
            q: ['Query is required'],
          },
        })),
      });

      try {
        await apiClient.get('/api/v1/search');
        fail('Should have thrown');
      } catch (e) {
        expect(e.body).toHaveProperty('code');
        expect(e.body).toHaveProperty('message');
        expect(e.body.code).toBe(ERROR_CODES.QUERY_REQUIRED);
      }
    });

    it('422 with QUERY_REQUIRED is distinct from other 422 errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Validation failed',
          code: ERROR_CODES.QUERY_REQUIRED,
        })),
      });

      try {
        await apiClient.get('/api/v1/search?q=');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(422);
        expect(e.body.code).toBe(ERROR_CODES.QUERY_REQUIRED);
        expect(e.body.code).not.toBe('OTHER_ERROR');
      }
    });
  });
});

describe('HTTP Status Code Handling', () => {
  describe('401 Unauthorized', () => {
    it('401 clears session for authenticated users', async () => {
      authStorage.getToken.mockResolvedValue('fake-token');
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthenticated'),
      });

      try {
        await apiClient.get('/api/v1/user/completed-exams');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(401);
        expect(mockClearSession).toHaveBeenCalled();
      }
    });

    it('401 on guest GET request does not clear session', async () => {
      authStorage.getToken.mockResolvedValue(null);
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthenticated'),
      });

      try {
        await apiClient.get('/api/v1/protected-resource');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(401);
        expect(mockClearSession).not.toHaveBeenCalled();
      }
    });

    it('401 includes error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Token expired',
        })),
      });

      try {
        await apiClient.get('/api/v1/user/profile');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(401);
        expect(e.body).toHaveProperty('message');
      }
    });
  });

  describe('403 Forbidden', () => {
    it('403 without error code is handled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Access denied',
        })),
      });

      try {
        await apiClient.get('/api/v1/admin/users');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(403);
        expect(e.body.message).toBe('Access denied');
      }
    });

    it('403 with EXAM_COMPLETED has specific handling', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Exam completed',
          code: ERROR_CODES.EXAM_COMPLETED,
          redirect: 'ket_qua',
          dethi_id: 123,
          user_diem: 8.5,
        })),
      });

      try {
        await apiClient.get('/api/v1/de-thi/123/lam-bai');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(403);
        expect(e.body.code).toBe(ERROR_CODES.EXAM_COMPLETED);
      }
    });
  });

  describe('404 Not Found', () => {
    it('404 throws without clearing session', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Resource not found',
        })),
      });

      try {
        await apiClient.get('/api/v1/de-thi/99999');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(404);
        expect(mockClearSession).not.toHaveBeenCalled();
      }
    });

    it('404 includes error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Exam not found',
        })),
      });

      try {
        await apiClient.get('/api/v1/de-thi/00000');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(404);
        expect(e.body.message).toBe('Exam not found');
      }
    });
  });

  describe('422 Validation Error', () => {
    it('422 includes validation errors object', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve(JSON.stringify({
          message: 'The given data was invalid',
          errors: {
            email: ['The email field is required.'],
            password: ['The password field is required.'],
          },
        })),
      });

      try {
        await apiClient.post('/api/v1/login', {});
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(422);
        expect(e.body).toHaveProperty('errors');
        expect(e.body.errors).toHaveProperty('email');
        expect(e.body.errors).toHaveProperty('password');
      }
    });

    it('422 with specific error code is identifiable', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Query required',
          code: ERROR_CODES.QUERY_REQUIRED,
        })),
      });

      try {
        await apiClient.get('/api/v1/search?q=');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(422);
        expect(e.body.code).toBe(ERROR_CODES.QUERY_REQUIRED);
      }
    });
  });

  describe('429 Too Many Requests', () => {
    it('429 includes rate limit information', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Too many requests',
          code: ERROR_CODES.LIMIT_REACHED,
          retry_after: 3600,
        })),
      });

      try {
        await apiClient.post('/api/v1/de-thi/123/nop-bai', { answers: [] });
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(429);
        expect(e.body.code).toBe(ERROR_CODES.LIMIT_REACHED);
      }
    });
  });

  describe('500 Server Error', () => {
    it('500 throws with error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({
          message: 'Internal server error',
        })),
      });

      try {
        await apiClient.get('/api/v1/de-thi/123');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(500);
      }
    });

    it('500 does not clear session', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      try {
        await apiClient.get('/api/v1/home');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(500);
        expect(mockClearSession).not.toHaveBeenCalled();
      }
    });
  });

  describe('Network Errors', () => {
    it('network error (no response) throws', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network request failed'));

      try {
        await apiClient.get('/api/v1/home');
        fail('Should have thrown');
      } catch (e) {
        expect(e.message).toContain('Network');
      }
    });

    it('network error does not have status code', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Timeout'));

      try {
        await apiClient.get('/api/v1/de-thi/123');
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBeUndefined();
      }
    });
  });
});

describe('Error Response Format', () => {
  it('error has status property', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    });

    try {
      await apiClient.get('/api/v1/unknown');
      fail('Should have thrown');
    } catch (e) {
      expect(e).toHaveProperty('status');
      expect(e.status).toBe(404);
    }
  });

  it('error has body property with parsed JSON', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: () => Promise.resolve(JSON.stringify({
        message: 'Validation failed',
        errors: { field: ['error'] },
      })),
    });

    try {
      await apiClient.post('/api/v1/test', {});
      fail('Should have thrown');
    } catch (e) {
      expect(e).toHaveProperty('body');
      expect(typeof e.body).toBe('object');
      expect(e.body).toHaveProperty('message');
      expect(e.body).toHaveProperty('errors');
    }
  });

  it('error with non-JSON response has null body', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    try {
      await apiClient.get('/api/v1/broken');
      fail('Should have thrown');
    } catch (e) {
      expect(e).toHaveProperty('body');
      expect(e.body).toBeNull();
    }
  });

  it('error message is set from response text', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Resource not found'),
    });

    try {
      await apiClient.get('/api/v1/missing');
      fail('Should have thrown');
    } catch (e) {
      expect(e.message).toBeTruthy();
    }
  });
});

describe('Error Code Constants', () => {
  it('ERROR_CODES.EXAM_COMPLETED is defined', () => {
    expect(ERROR_CODES.EXAM_COMPLETED).toBe('EXAM_COMPLETED');
  });

  it('ERROR_CODES.LIMIT_REACHED is defined', () => {
    expect(ERROR_CODES.LIMIT_REACHED).toBe('LIMIT_REACHED');
  });

  it('ERROR_CODES.QUERY_REQUIRED is defined', () => {
    expect(ERROR_CODES.QUERY_REQUIRED).toBe('QUERY_REQUIRED');
  });

  it('all error codes are unique strings', () => {
    const codes = Object.values(ERROR_CODES);
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);
    codes.forEach(code => {
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });
  });
});
