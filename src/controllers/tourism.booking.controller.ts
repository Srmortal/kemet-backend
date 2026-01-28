import { ApiError } from '@utils/ApiError';
import type { DomainError } from '../types/domain-error.type';
import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import type { paths, components } from '../types/api';

// Local type aliases for OpenAPI-generated types
type CreateTourismBookingRequest = Request<unknown, unknown, components['schemas']['CreateTourismBookingRequest']>;
type CreateTourismBookingResponse = Response<
  paths['/tourism/bookings']['post']['responses']['201']['content']['application/json']
>;

type GetTourismBookingsRequest = Request;
type GetTourismBookingsResponse = Response<
  paths['/tourism/bookings']['get']['responses']['200']['content']['application/json']
>;

// POST /tourism/bookings
export const createTourismBooking = async (
  req: CreateTourismBookingRequest,
  res: CreateTourismBookingResponse,
  next: NextFunction
) => {
  // Map API type to domain input
  // Map API type to domain input, ensuring required fields for CreateBookingParams
  const bookingInput = {
    placeId: req.body.siteId, // Map siteId from API to placeId in domain
    userId: req.user.id,
    date: req.body.date,
    guests: req.body.guests, // Ensure guests is provided
    time: req.body.time, // Optional, if available
    specialRequests: req.body.specialRequests // Optional, if available
  };
  const bookingResult = await bookingService.createBooking(bookingInput);
  if (!bookingResult.ok) {
    const err = bookingResult.error as DomainError;
    let apiError;
    switch (err.type) {
      case 'NotFound':
        apiError = new ApiError(404, err.message);
        break;
      case 'Conflict':
        apiError = new ApiError(409, err.message);
        break;
      default:
        apiError = new ApiError(500, err.message || 'Internal Server Error');
    }
    return next(apiError);
  }
  // Map domain result to API response shape
  const booking = bookingResult.value;
  const payload: paths['/tourism/bookings']['post']['responses']['201']['content']['application/json'] = {
    bookingId: booking.id,
    siteId: booking.placeId,
    date: booking.date,
    guests: booking.guests,
    time: booking.time,
    specialRequests: booking.specialRequests
  };
  res.status(201).json(payload);
};

// GET /tourism/bookings
export const getTourismBookings = async (
  req: GetTourismBookingsRequest,
  res: GetTourismBookingsResponse,
  next: NextFunction
) => {
  // Only return bookings for the authenticated user
  const userId = req.user.id;
  const result = await bookingService.getUserBookings(userId);
  if (!result.ok) {
    const err = result.error as DomainError;
    let apiError;
    switch (err.type) {
      case 'NotFound':
        apiError = new ApiError(404, err.message);
        break;
      case 'Conflict':
        apiError = new ApiError(409, err.message);
        break;
      default:
        apiError = new ApiError(500, err.message || 'Internal Server Error');
    }
    return next(apiError);
  }
  // Map domain bookings to API response shape
  const payload: paths['/tourism/bookings']['get']['responses']['200']['content']['application/json'] = result.value.map(
    (booking: { id: string; placeId: string; date: string; guests: number; time?: string; specialRequests?: string }) => ({
      bookingId: booking.id,
      siteId: booking.placeId,
      date: booking.date,
      guests: booking.guests,
      time: booking.time,
      specialRequests: booking.specialRequests
    })
  );
  res.json(payload);
};
