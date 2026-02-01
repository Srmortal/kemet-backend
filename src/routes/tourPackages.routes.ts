// src/routes/tourPackageBooking.routes.ts

import { Router } from 'express';
import { TourPackageController } from '../controllers/tourPackage.controller';

const router = Router();

router.post('/book', TourPackageController.bookTourPackageController);
router.get('/', TourPackageController.getAllTourPackages);
router.get('/:id', TourPackageController.getTourPackageById);

export default router;