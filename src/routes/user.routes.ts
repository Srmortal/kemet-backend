import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { firebaseAuth } from '../middleware/firebaseAuth';
import { validateRequest } from '../middleware/validateRequest';
import { updateUserSchema } from '../validators/user.validator';

const router = Router();
const userController = new UserController();

router.get('/profile', firebaseAuth, userController.getProfile);
router.get('/:id', firebaseAuth, userController.getUserById);
router.put('/:id', firebaseAuth, validateRequest(updateUserSchema), userController.updateUser);
router.delete('/:id', firebaseAuth, userController.deleteUser);

export default router;
