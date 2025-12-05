import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

const authService = new AuthService();

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, password, name } = req.body;

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  });

  login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  logout = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Implement logout logic (e.g., blacklist token, clear session)
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  });

  firebaseLogin = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const firebaseUser = req.firebaseUser as { uid: string; email?: string; name?: string } | undefined;
    if (!firebaseUser?.uid) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await authService.loginWithFirebase(firebaseUser.uid, firebaseUser.email, firebaseUser.name);

    res.status(200).json({
      success: true,
      message: 'Firebase login successful',
      data: result,
    });
  });
}
