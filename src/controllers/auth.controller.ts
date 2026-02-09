import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import type { components } from '../types/api';
import { userService } from '../di';
import { ApiError } from '@utils/ApiError';
import { DomainError } from 'types/domain-error.type';

// OpenAPI-generated types
type VerifyRequest = Request<unknown, unknown, components['schemas']['VerifyUserIdTokenRequest']>;
type VerifyResponse = Response<components['schemas']['VerifyUserIdTokenResponse']>;

type LogoutRequest = Request;
type LogoutResponse = Response<components['schemas']['LogoutUserResponse']>;

export class AuthController {
  verify = asyncHandler(async (req: VerifyRequest, res: VerifyResponse, next: NextFunction) => {
    // req.user is set by the authentication middleware after decoding idToken
    const firebaseUser = req.user!;
    const additionalData = req.body;


    // Upsert user and role/admin logic
    let user = await userService.upsertUserWithRole({
      email: firebaseUser.email,
      name: firebaseUser.name,
      ...firebaseUser
    });
    if (!user.ok) {
      const err = user.error as DomainError;
      let apiError;
      switch (err.type) {
        case 'NotFound':
          apiError = new ApiError(404, err.message);
          break;
        case 'Conflict':
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || 'Internal Server Error');
      }
      return next(apiError);
    }
    
    if (additionalData && Object.keys(additionalData).length > 0) {
      user = await userService.updateUserWithAdditionalData(user.value.id, additionalData);
    }

    if (!user.ok) {
      const err = user.error as DomainError;
      let apiError;
      switch (err.type) {
        case 'NotFound':
          apiError = new ApiError(404, err.message);
          break;
        case 'Conflict':
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || 'Internal Server Error');
      }
      return next(apiError);
    }
    const payload: components['schemas']['VerifyUserIdTokenResponse'] = {
      userId: user.value.id,
      email: user.value.email!,
    };
    res.status(201).json(payload);
  });

  logout = asyncHandler(async (_req: LogoutRequest, res: LogoutResponse, _next: NextFunction) => {
    res.status(200).json({ status: 'success' });
  });
}
