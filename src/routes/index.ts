import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import testRoutes from './test.routes';
import monumentsRoutes from './monuments.routes';
import tazkartiRoutes from './tazkarti.routes';
import shoufRoutes from './shouf.routes';
import tourismRoutes from './tourism.routes';
import bookingRoutes from './booking.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/test', testRoutes);
router.use('/monuments', monumentsRoutes);
router.use('/tazkarti', tazkartiRoutes);
router.use('/shouf', shoufRoutes);
router.use('/tourism', tourismRoutes);
router.use('/accommodations', bookingRoutes);

export default router;
