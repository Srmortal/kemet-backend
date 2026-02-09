import { Router } from 'express';

import authRoutes from './auth.routes';
import tourismRoutes from './tourism.routes';
//import adminRoutes from './firebase-admin.routes';
//import kemetMartRoutes from './kemetMart.routes';
import adventureRoutes from './adventure.routes';
import tourPackagesRoutes from './tourPackages.routes';
import guidesRoutes from './guides.routes';
import { firebaseAuth } from '@middleware/firebaseAuth';
//import currencyExchangeRoutes from './currencyExchange.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use(firebaseAuth);


router.use('/auth', authRoutes);
router.use('/tourism', tourismRoutes);
//router.use('/hotels', hotelRoutes);
//router.use('/admin', adminRoutes);
//router.use('/kemetmart', kemetMartRoutes);
router.use('/adventures', adventureRoutes);
//router.use('/exchange', currencyExchangeRoutes);
router.use('/tour-packages', tourPackagesRoutes);
router.use('/guides', guidesRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
