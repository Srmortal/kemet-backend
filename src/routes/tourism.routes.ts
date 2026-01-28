import { Router } from 'express';
import * as tourismController from '@controllers/tourism.controller';
import * as bookingController from '@controllers/tourism.booking.controller';
import { firebaseAuth } from '@middleware/firebaseAuth';

const router = Router();

// Get all places with filters and pagination
router.get('/', tourismController.getTourismPlaces);

// Get place statistics
router.get('/stats/overview', tourismController.getTourismStats);

// Get available locations
router.get('/locations/list', tourismController.getTourismLocations);

// Get available categories
router.get('/categories/list', tourismController.getTourismCategories);

// Get place by ID
router.get('/:id', tourismController.getTourismPlaceById);

// Create a new booking - validate input BEFORE auth
router.post('/bookings', firebaseAuth, bookingController.createTourismBooking);

// Get bookings for the authenticated user
router.get('/bookings', firebaseAuth, bookingController.getTourismBookings);

export default router;
