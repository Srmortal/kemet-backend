import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const userService = new UserService();

export class UserController {
  getProfile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Using Firebase UID from firebaseAuth middleware
    const firebaseUid = req.firebaseUser?.uid;

    if (!firebaseUid) {
      throw new ApiError(401, 'Unauthorized');
    }

    // Get the app user by Firebase UID
    const user = await userService.getUserByFirebaseUid(firebaseUid);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  updateUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;

    const user = await userService.updateUser(id, updateData);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    await userService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  });
}
