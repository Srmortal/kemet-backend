import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Protected route: Client sends ID token, server verifies and syncs user
router.post('/verify', authController.verify);

// Logout (mostly client-side action, but endpoint provided for potential hooks)
router.post('/logout', authController.logout);

export default router;

