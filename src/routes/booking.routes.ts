import { Router } from 'express';
import * as bookingController from '@controllers/booking.controller';

const router = Router();

// Get all accommodations with filters and pagination
router.get('/', bookingController.getAccommodations);

// Get accommodation statistics
router.get('/stats/overview', bookingController.getAccommodationStats);

// Get available locations
router.get('/locations/list', bookingController.getAccommodationLocations);

// Get available types
router.get('/types/list', bookingController.getAccommodationTypes);

// Search accommodations
router.get('/search', bookingController.searchAccommodations);

// Get accommodation by ID
router.get('/:id', bookingController.getAccommodationById);

export default router;
