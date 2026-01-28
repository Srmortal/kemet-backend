import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '@config/firebase';
import { ApiError } from '@utils/ApiError';

export async function firebaseAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return next(new ApiError(401, 'Missing Authorization header'));
    }
    if (!authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Invalid Authorization header format'));
    }

    const idToken = authHeader.substring(7).trim();
    if (!idToken) {
      return next(new ApiError(401, 'Empty Bearer token'));
    }

    // Optionally: reject tokens with extra spaces or wrong scheme
    if (authHeader.match(/^Bearer\s+$/) || authHeader.match(/^bearer /i) === null) {
      return next(new ApiError(401, 'Malformed Bearer token'));
    }

    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (err) {
      return next(new ApiError(401, 'Invalid Firebase credentials'));
    }

    if (!decoded || !decoded.uid) {
      return next(new ApiError(401, 'Invalid Firebase user'));
    }
    req.user = {
      ...decoded,
      id: decoded.uid
    };
    next();
  } catch (err) {
    next(new ApiError(401, 'Authentication failed'));
  }
}
