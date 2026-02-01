import { Request, Response, NextFunction } from 'express';
import {ApiError} from '../utils/ApiError';

/**
 * Middleware to check if the authenticated user can only access their own resources
 * Compares the user ID from the JWT with the ID in the route parameter
 */
export const checkUserOwnership = (req: Request, _res: Response, next: NextFunction) => {
  const authenticatedUserId = req.user?.uid;
  const requestedUserId = req.params.id || req.params.userId;

  if (!authenticatedUserId) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  // Allow if user is accessing their own resource
  if (requestedUserId && requestedUserId !== authenticatedUserId) {
    return next(new ApiError(403, 'Forbidden: You can only access your own resources'));
  }

  next();
};

/**
 * Middleware to check if user has admin role
 * Requires Firebase custom claims to include admin: true
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  // Check for admin claim in Firebase custom claims
  const isAdmin = user.admin === true || user.role === 'admin';

  if (!isAdmin) {
    return next(new ApiError(403, 'Forbidden: Admin access required'));
  }

  next();
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (role: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const userRole = user.role;

    if (userRole !== role) {
      return next(new ApiError(403, `Forbidden: ${role} role required`));
    }

    next();
  };
};

/**
 * Middleware to check if the user can update a specific user
 * Allows users to update their own information, and admins to update any user
 * Optionally prevents admins from updating other admins
 */
export const canUpdateUser = async (req: Request, _res: Response, next: NextFunction) => {
  const currentUserId = req.user?.uid;
  const targetUserId = req.params.id || currentUserId;

  if (!currentUserId) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  // If updating self, always allowed
  if (currentUserId === targetUserId) {
    return next();
  }

  // If not admin, block
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Forbidden'));
  }

  next();
};
