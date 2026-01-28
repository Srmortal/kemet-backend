import { Router } from 'express';

import authRoutes from './auth.routes';
import tourismRoutes from './tourism.routes';
//import adminRoutes from './firebase-admin.routes';
//import kemetMartRoutes from './kemetMart.routes';
import adventureRoutes from './adventure.routes';
import tourPackagesRoutes from './tourPackages.routes';
import guidesRoutes from './guides.routes';
//import currencyExchangeRoutes from './currencyExchange.routes';

const router = Router();


router.use('/auth', authRoutes);
router.use('/tourism', tourismRoutes);
//router.use('/hotels', hotelRoutes);
//router.use('/admin', adminRoutes);
//router.use('/kemetmart', kemetMartRoutes);
router.use('/adventures', adventureRoutes);
//router.use('/exchange', currencyExchangeRoutes);
router.use('/tour-packages', tourPackagesRoutes);
router.use('/guides', guidesRoutes);

export default router;
