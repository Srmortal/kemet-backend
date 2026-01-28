// src/routes/tourPackageBooking.routes.ts

import { Router } from 'express';
import { TourPackageController } from '../controllers/tourPackage.controller';
import { firebaseAuth } from '@middleware/firebaseAuth';

const router = Router();

router.post('/book', firebaseAuth, TourPackageController.bookTourPackageController);
router.get('/', TourPackageController.getAllTourPackages);
router.get('/:id', TourPackageController.getTourPackageById);

export default router;