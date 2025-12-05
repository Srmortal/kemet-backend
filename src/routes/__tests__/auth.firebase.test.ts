import request from 'supertest';

// Mock Firebase verify module before importing app
jest.mock('../../config/firebase', () => ({
  verifyIdToken: jest.fn(async (token: string) => {
    if (token === 'VALID_TOKEN') {
      return { uid: 'uid123', email: 'user@example.com', name: 'Test User' };
    }
    throw new Error('Invalid Firebase ID token');
  }),
}));

import app from '../../app';

describe('POST /api/auth/firebase', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).post('/api/auth/firebase');
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid Firebase token', async () => {
    const res = await request(app)
      .post('/api/auth/firebase')
      .set('Authorization', 'Bearer INVALID_TOKEN');
    expect(res.status).toBe(401);
  });

  it('returns 200 and user for valid Firebase token', async () => {
    const res = await request(app)
      .post('/api/auth/firebase')
      .set('Authorization', 'Bearer VALID_TOKEN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data).not.toHaveProperty('accessToken');
    expect(res.body.data).not.toHaveProperty('refreshToken');
  });
});
