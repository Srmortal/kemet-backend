import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user has admin role
 * Must be used AFTER firebaseAuth middleware
 */
export const adminAuth = (req: Request, _res: Response, next: NextFunction) => {
  const firebaseUser = req.firebaseUser as { uid: string; admin?: boolean; role?: string } | undefined;

  if (!firebaseUser) {
    return next(new ApiError(401, 'Authentication required'));
  }

  // Check for admin custom claim
  const isAdmin = firebaseUser.admin === true || firebaseUser.role === 'admin';

  if (!isAdmin) {
    return next(new ApiError(403, 'Forbidden: Admin access required'));
  }

  next();
};
