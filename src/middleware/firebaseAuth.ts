import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../config/firebase';
import { ApiError } from '../utils/ApiError';

export async function firebaseAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    // Optional dev bypass for local testing without a client
    if (process.env.FIREBASE_AUTH_BYPASS === 'true' && process.env.NODE_ENV === 'development') {
      (req as any).firebaseUser = { uid: 'dev-bypass-uid' };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Missing Authorization header'));
    }

    const idToken = authHeader.substring(7);
    const decoded = await verifyIdToken(idToken);

    // Attach Firebase user info onto request
    (req as any).firebaseUser = decoded;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid Firebase credentials';
    next(new ApiError(401, message));
  }
}
