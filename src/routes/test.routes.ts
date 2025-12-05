import { Router, Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../middleware/firebaseAuth';
import { UserService } from '../services/user.service';

const router = Router();
const userService = new UserService();

// GET /api/test/firebase
// Protected route that demonstrates Firebase auth integration.
router.get('/firebase', firebaseAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const firebaseUser = req.firebaseUser as { uid: string; email?: string; name?: string } | undefined;
    if (!firebaseUser?.uid) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Map or create an application user from Firebase UID
    const appUser = await userService.getOrCreateFromFirebase(firebaseUser.uid, {
      email: firebaseUser.email,
      name: firebaseUser.name,
    });

    res.json({
      success: true,
      message: 'Firebase test route OK',
      data: {
        firebaseUser,
        appUser,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
