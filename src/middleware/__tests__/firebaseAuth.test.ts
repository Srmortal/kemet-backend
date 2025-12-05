import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../firebaseAuth';
import { ApiError } from '../../utils/ApiError';

jest.mock('../../config/firebase', () => ({
  verifyIdToken: jest.fn(async (token: string) => {
    if (token === 'VALID_TOKEN') {
      return { uid: 'uid123', email: 'user@example.com', name: 'Test User' };
    }
    throw new Error('Invalid Firebase ID token');
  }),
}));

describe('firebaseAuth middleware', () => {
  const makeMock = (authHeader?: string) => {
    const req = { headers: {} as Record<string, string>, firebaseUser: undefined } as unknown as Request;
    if (authHeader) req.headers['authorization'] = authHeader;
    const res = {} as Response;
    const next = jest.fn() as unknown as NextFunction;
    return { req, res, next };
  };

  it('should 401 when Authorization header missing', async () => {
    const { req, res, next } = makeMock();
    await firebaseAuth(req, res, next);
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(ApiError);
    const err = (next as any).mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
  });

  it('should 401 when token invalid', async () => {
    const { req, res, next } = makeMock('Bearer INVALID_TOKEN');
    await firebaseAuth(req, res, next);
    const err = (next as any).mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it('should attach firebaseUser and call next for valid token', async () => {
    const { req, res, next } = makeMock('Bearer VALID_TOKEN');
    await firebaseAuth(req, res, next);
    expect((req as any).firebaseUser).toEqual({ uid: 'uid123', email: 'user@example.com', name: 'Test User' });
    expect((next as any).mock.calls.length).toBe(1);
    expect((next as any).mock.calls[0][0]).toBeUndefined();
  });
});
