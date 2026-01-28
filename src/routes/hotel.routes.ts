// import { Router } from 'express';
// import {
// 	createHotelBooking,
// 	getHotelBookingConfirmation,
// 	getHotels,
// 	getHotelDetails,
// 	getHotelRooms,
// } from '@controllers/hotel.controller';
// import { firebaseAuth } from '@middleware/firebaseAuth';
// // import { validateCreateHotelBooking } from '@validators/hotel.booking.validator';

// const router = Router();

// // Public routes
// router.get('/', getHotels);
// router.get('/:id', getHotelDetails);
// router.get('/:id/rooms', getHotelRooms);

// // Protected routes (require authentication)
// router.post('/bookings', firebaseAuth, createHotelBooking);
// router.get('/bookings/:id/confirmation', firebaseAuth, getHotelBookingConfirmation);

// export default router;