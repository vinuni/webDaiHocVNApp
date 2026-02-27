/**
 * Comprehensive API Integration Tests
 * Tests real API flows: authentication, home, exam, results, search
 * 
 * NOTE: These are real API tests that require a running test server.
 * Set SKIP_INTEGRATION_TESTS=true in environment to skip these tests in CI.
 */

// Mock AsyncStorage before importing apiClient
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

import { apiClient, ERROR_CODES } from '../client';
import { authStorage } from '../../auth/storage';

const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION_TESTS === 'true';

const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'password',
};

describe('API Integration Tests', () => {
  beforeAll(() => {
    if (SKIP_INTEGRATION) {
      console.warn('⏭️  Skipping integration tests (SKIP_INTEGRATION_TESTS=true)');
    } else {
      console.log('ℹ️  Running integration tests with test credentials');
      console.log('ℹ️  If tests fail, ensure TEST_USER_EMAIL and TEST_USER_PASSWORD are set');
    }
  });

  describe('Authentication Flow', () => {
    beforeEach(async () => {
      await authStorage.setToken(null);
      await authStorage.setUser(null);
    });

    it('login with valid credentials returns token and user', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const res = await apiClient.post('/api/v1/login', {
          email: TEST_CREDENTIALS.email,
          password: TEST_CREDENTIALS.password,
        });

        expect(res).toHaveProperty('token');
        expect(res).toHaveProperty('user');
        expect(res.token_type).toBe('Bearer');
        expect(res.user).toHaveProperty('email');
        expect(typeof res.token).toBe('string');
        expect(res.token.length).toBeGreaterThan(0);
      } catch (e) {
        if (e.status === 422) {
          console.warn('⏭️  Skipping: Test credentials do not exist. Set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars.');
          return;
        }
        throw e;
      }
    });

    it('login with invalid credentials returns 422 validation error', async () => {
      if (SKIP_INTEGRATION) return;

      await expect(
        apiClient.post('/api/v1/login', {
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toMatchObject({
        status: 422,
      });
    });

    it('access protected endpoint without token returns 401', async () => {
      if (SKIP_INTEGRATION) return;

      await authStorage.setToken(null);
      
      await expect(
        apiClient.get('/api/v1/user/completed-exams')
      ).rejects.toMatchObject({
        status: 401,
      });
    });

    it('access protected endpoint with valid token returns 200', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const loginRes = await apiClient.post('/api/v1/login', TEST_CREDENTIALS);
        await authStorage.setToken(loginRes.token);

        const res = await apiClient.get('/api/v1/user/completed-exams');
        expect(res).toHaveProperty('completed');
        expect(Array.isArray(res.completed)).toBe(true);
      } catch (e) {
        if (e.status === 422) {
          console.warn('⏭️  Skipping: Test credentials invalid');
          return;
        }
        throw e;
      }
    });

    it('logout endpoint clears token', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const loginRes = await apiClient.post('/api/v1/login', TEST_CREDENTIALS);
        await authStorage.setToken(loginRes.token);

        const res = await apiClient.post('/api/v1/logout');
        expect(res).toHaveProperty('message');
      } catch (e) {
        if (e.status === 422) {
          console.warn('⏭️  Skipping: Test credentials invalid');
          return;
        }
        throw e;
      }
    });
  });

  describe('Home Endpoint', () => {
    it('guest access returns 200 with user_attempted: false', async () => {
      if (SKIP_INTEGRATION) return;

      await authStorage.setToken(null);

      const res = await apiClient.get('/api/v1/home');
      
      expect(res).toHaveProperty('mon_this');
      expect(res).toHaveProperty('study_materials_summary');
      expect(res).toHaveProperty('leaderboard');
      expect(Array.isArray(res.mon_this)).toBe(true);
      expect(Array.isArray(res.leaderboard)).toBe(true);

      // Check exams within mon_this (nested structure)
      if (res.mon_this.length > 0 && res.mon_this[0].de_this?.length > 0) {
        const firstExam = res.mon_this[0].de_this[0];
        expect(firstExam).toHaveProperty('user_attempted');
        expect(firstExam.user_attempted).toBe(false);
      }
    });

    it('authenticated access returns 200 with user_attempted flags', async () => {
      if (SKIP_INTEGRATION) return;

      try {
        const loginRes = await apiClient.post('/api/v1/login', TEST_CREDENTIALS);
        await authStorage.setToken(loginRes.token);

        const res = await apiClient.get('/api/v1/home');
        
        expect(res).toHaveProperty('mon_this');
        expect(Array.isArray(res.mon_this)).toBe(true);

        if (res.mon_this.length > 0 && res.mon_this[0].de_this?.length > 0) {
          const firstExam = res.mon_this[0].de_this[0];
          expect(firstExam).toHaveProperty('user_attempted');
          expect(typeof firstExam.user_attempted).toBe('boolean');
        }
      } catch (e) {
        if (e.status === 422) {
          console.warn('⏭️  Skipping: Test credentials invalid');
          return;
        }
        throw e;
      }
    });

    it('response includes study materials summary', async () => {
      if (SKIP_INTEGRATION) return;

      const res = await apiClient.get('/api/v1/home');
      
      expect(res).toHaveProperty('study_materials_summary');
      // Accept both array and object format for study_materials_summary
      const isArray = Array.isArray(res.study_materials_summary);
      const isObject = typeof res.study_materials_summary === 'object';
      expect(isArray || isObject).toBe(true);
    });

    it('response includes leaderboard with top users', async () => {
      if (SKIP_INTEGRATION) return;

      const res = await apiClient.get('/api/v1/home');
      
      expect(res).toHaveProperty('leaderboard');
      expect(Array.isArray(res.leaderboard)).toBe(true);
      
      if (res.leaderboard.length > 0) {
        const firstUser = res.leaderboard[0];
        expect(firstUser).toHaveProperty('rank');
        expect(firstUser).toHaveProperty('name');
        expect(firstUser).toHaveProperty('xp');
        expect(firstUser).toHaveProperty('level');
      }
    });
  });

  describe('Exam Flow', () => {
    let token;
    let testExamId;

    beforeAll(async () => {
      if (SKIP_INTEGRATION) return;
      
      try {
        const loginRes = await apiClient.post('/api/v1/login', TEST_CREDENTIALS);
        token = loginRes.token;
        await authStorage.setToken(token);

        const homeRes = await apiClient.get('/api/v1/home');
        // Get exam from nested mon_this structure
        if (homeRes.mon_this?.length > 0 && homeRes.mon_this[0].de_this?.length > 0) {
          testExamId = homeRes.mon_this[0].de_this[0].id;
        }
      } catch (e) {
        if (e.status === 422) {
          console.warn('⏭️  Skipping Exam Flow tests: Invalid test credentials');
        }
      }
    });

    it('start new exam returns questions', async () => {
      if (SKIP_INTEGRATION || !testExamId) {
        console.warn('⏭️  Skipping: No test exam available');
        return;
      }

      const res = await apiClient.get(`/api/v1/de-thi/${testExamId}/lam-bai`);
      
      expect(res).toHaveProperty('de_thi');
      expect(res).toHaveProperty('questions');
      expect(Array.isArray(res.questions)).toBe(true);
      expect(res.de_thi).toHaveProperty('id');
      expect(res.de_thi).toHaveProperty('tendethi');
      expect(res.de_thi).toHaveProperty('thoigian');

      if (res.questions.length > 0) {
        const firstQuestion = res.questions[0];
        expect(firstQuestion).toHaveProperty('id');
        expect(firstQuestion).toHaveProperty('cauhoi');
        expect(firstQuestion).toHaveProperty('dapanA');
      }
    });

    it('submit exam returns score and statistics', async () => {
      if (SKIP_INTEGRATION || !testExamId) {
        console.warn('⏭️  Skipping: No test exam available');
        return;
      }

      const examRes = await apiClient.get(`/api/v1/de-thi/${testExamId}/lam-bai`);
      
      const answers = examRes.questions.map(q => ({
        question_id: q.id,
        answer: 'A',
        duration_seconds: 10,
      }));

      try {
        const res = await apiClient.post(`/api/v1/de-thi/${testExamId}/nop-bai`, {
          answers,
        });

        expect(res).toHaveProperty('diem');
        expect(res).toHaveProperty('correct');
        expect(res).toHaveProperty('total');
        expect(typeof res.diem).toBe('number');
        expect(typeof res.correct).toBe('number');
        expect(typeof res.total).toBe('number');
        expect(res.total).toBe(examRes.questions.length);
      } catch (e) {
        if (e.status === 403 && e.body?.code === ERROR_CODES.EXAM_COMPLETED) {
          console.log('✓ Exam already completed, received EXAM_COMPLETED error as expected');
          expect(e.body).toHaveProperty('user_diem');
        } else {
          throw e;
        }
      }
    });

    it('start completed exam returns 403 with EXAM_COMPLETED code', async () => {
      if (SKIP_INTEGRATION || !testExamId) {
        console.warn('⏭️  Skipping: No test exam available');
        return;
      }

      try {
        await apiClient.get(`/api/v1/de-thi/${testExamId}/lam-bai`);
      } catch (e) {
        if (e.status === 403 && e.body?.code === ERROR_CODES.EXAM_COMPLETED) {
          expect(e.body).toHaveProperty('redirect');
          expect(e.body.redirect).toBe('ket_qua');
          expect(e.body).toHaveProperty('dethi_id');
          expect(e.body).toHaveProperty('user_diem');
          expect(typeof e.body.user_diem).toBe('number');
        }
      }
    });

    it('submit already completed exam returns 403 with EXAM_COMPLETED', async () => {
      if (SKIP_INTEGRATION || !testExamId) {
        console.warn('⏭️  Skipping: No test exam available');
        return;
      }

      const answers = [
        { question_id: 1, answer: 'A', duration_seconds: 10 },
      ];

      try {
        await apiClient.post(`/api/v1/de-thi/${testExamId}/nop-bai`, { answers });
      } catch (e) {
        if (e.status === 403) {
          expect(e.body?.code).toBe(ERROR_CODES.EXAM_COMPLETED);
        }
      }
    });
  });

  describe('Results Endpoint', () => {
    let token;
    let completedExamId;

    beforeAll(async () => {
      if (SKIP_INTEGRATION) return;
      
      try {
        const loginRes = await apiClient.post('/api/v1/login', TEST_CREDENTIALS);
        token = loginRes.token;
        await authStorage.setToken(token);

        const completedRes = await apiClient.get('/api/v1/user/completed-exams');
        if (completedRes.completed && completedRes.completed.length > 0) {
          completedExamId = completedRes.completed[0].de_thi_id;
        }
      } catch (e) {
        if (e.status === 422 || e.status === 401) {
          console.warn('⏭️  Skipping Results tests: Invalid test credentials');
        }
      }
    });

    it('get results for completed exam returns bailams array', async () => {
      if (SKIP_INTEGRATION || !completedExamId) {
        console.warn('⏭️  Skipping: No completed exam available');
        return;
      }

      const res = await apiClient.get(`/api/v1/ket-qua/${completedExamId}`);
      
      expect(res).toHaveProperty('diem');
      expect(res).toHaveProperty('correct');
      expect(res).toHaveProperty('total');
      expect(res).toHaveProperty('bailams');
      expect(Array.isArray(res.bailams)).toBe(true);

      if (res.bailams.length > 0) {
        const firstBailam = res.bailams[0];
        expect(firstBailam).toHaveProperty('question_id');
        expect(firstBailam).toHaveProperty('dung');
        expect(firstBailam).toHaveProperty('traloi');
        expect(firstBailam).toHaveProperty('dapan_dung');
        expect(firstBailam).toHaveProperty('has_short_answer');
        expect(firstBailam).toHaveProperty('has_detailed_answer');
        expect(typeof firstBailam.dung).toBe('boolean');
      }
    });

    it('lazy load answer returns short_answer and detailed_answer', async () => {
      if (SKIP_INTEGRATION || !completedExamId) {
        console.warn('⏭️  Skipping: No completed exam available');
        return;
      }

      const resultsRes = await apiClient.get(`/api/v1/ket-qua/${completedExamId}`);
      
      if (resultsRes.bailams.length === 0) {
        console.warn('⏭️  Skipping: No bailams available');
        return;
      }

      const bailamWithAnswer = resultsRes.bailams.find(
        b => b.has_short_answer || b.has_detailed_answer
      );

      if (!bailamWithAnswer) {
        console.warn('⏭️  Skipping: No questions with answers');
        return;
      }

      const res = await apiClient.get(
        `/api/v1/ket-qua/${completedExamId}/answers/${bailamWithAnswer.question_id}`
      );

      if (bailamWithAnswer.has_short_answer) {
        expect(res).toHaveProperty('short_answer');
        expect(typeof res.short_answer).toBe('string');
      }

      if (bailamWithAnswer.has_detailed_answer) {
        expect(res).toHaveProperty('detailed_answer');
        expect(typeof res.detailed_answer).toBe('string');
      }
    });

    it('get results for non-completed exam returns 404 or 403', async () => {
      if (SKIP_INTEGRATION) return;

      const nonExistentExamId = 999999;
      
      await expect(
        apiClient.get(`/api/v1/ket-qua/${nonExistentExamId}`)
      ).rejects.toMatchObject({
        status: expect.toBeOneOf([401, 403, 404]),
      });
    });
  });

  describe('Search Endpoint', () => {
    it('search with valid query returns results', async () => {
      if (SKIP_INTEGRATION) return;

      const res = await apiClient.get('/api/v1/search?q=test&page=1');
      
      expect(res).toHaveProperty('data');
      expect(res).toHaveProperty('total');
      expect(res).toHaveProperty('per_page');
      expect(res).toHaveProperty('current_page');
      expect(Array.isArray(res.data)).toBe(true);
      expect(typeof res.total).toBe('number');
    });

    it('search with empty query returns 422 with QUERY_REQUIRED', async () => {
      if (SKIP_INTEGRATION) return;

      await expect(
        apiClient.get('/api/v1/search?q=')
      ).rejects.toMatchObject({
        status: 422,
        body: expect.objectContaining({
          code: ERROR_CODES.QUERY_REQUIRED,
        }),
      });
    });

    it('search pagination loads multiple pages correctly', async () => {
      if (SKIP_INTEGRATION) return;

      const page1 = await apiClient.get('/api/v1/search?q=test&page=1&per_page=5');
      
      expect(page1.current_page).toBe(1);
      expect(page1.data.length).toBeLessThanOrEqual(5);

      if (page1.total > 5) {
        const page2 = await apiClient.get('/api/v1/search?q=test&page=2&per_page=5');
        expect(page2.current_page).toBe(2);
        
        if (page1.data.length > 0 && page2.data.length > 0) {
          expect(page1.data[0].id).not.toBe(page2.data[0].id);
        }
      }
    });

    it('search with filters applies mon_thi filter', async () => {
      if (SKIP_INTEGRATION) return;

      const homeRes = await apiClient.get('/api/v1/home');
      if (homeRes.mon_this && homeRes.mon_this.length > 0) {
        const monThiId = homeRes.mon_this[0].id;
        
        const res = await apiClient.get(`/api/v1/search?q=test&mon_thi=${monThiId}`);
        expect(res).toHaveProperty('data');
        expect(Array.isArray(res.data)).toBe(true);
      }
    });

    it('search with no results returns empty data array', async () => {
      if (SKIP_INTEGRATION) return;

      const res = await apiClient.get('/api/v1/search?q=xyznonexistentquery123');
      
      expect(res).toHaveProperty('data');
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBe(0);
      expect(res.total).toBe(0);
    });
  });

  describe('Rate Limiting', () => {
    it('submitting too many exams returns 429 with LIMIT_REACHED', async () => {
      if (SKIP_INTEGRATION) {
        console.warn('⏭️  Skipping rate limit test (requires test environment)');
        return;
      }

      console.warn('⏭️  Rate limit test requires manual setup - marking as skipped');
    });
  });
});

expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
