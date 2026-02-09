// src/controllers/user.controller.ts


import { Request, Response, NextFunction } from 'express';
import { userService } from '../di'; 
import { components } from '../types/api';
import { ApiError } from '../utils/ApiError';

// Controller for GET /user/profile
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  const result = await userService.getUserProfileService(userId);
  if (result.ok) {
    const user = result.value;
    const profile: components['schemas']['ProfileDetailsDto'] = {
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ')[1] || '',
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      countryName: user.nationality,
      email: user.email || '',
      dob: typeof user.dateOfBirth === 'string'
        ? user.dateOfBirth
        : user.dateOfBirth instanceof Date
        ? user.dateOfBirth.toISOString()
        : undefined,
      bookingsCount: user.bookingsCount,
      favouritesCount: user.favouritesCount,
    };
    return res.status(200).json(profile);
  } else {
    switch (result.error?.type) {
      case 'NotFound':
        return next(new ApiError(404, 'User not found'));
      case 'ValidationError':
        return next(new ApiError(401, 'Validation error'));
      case 'Conflict':
        return next(new ApiError(409, 'Conflict error'));
      default:
        return next(new ApiError(500, 'Server error'));
    }
  }
};