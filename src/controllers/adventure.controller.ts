import { Request, Response, NextFunction } from 'express';
import { adventureService, adventureBookingService } from '../di';
import type { components } from '../types/api';
import { ApiError } from '@utils/ApiError';
import type { DomainError } from '../types/domain-error.type';

// Local type aliases for OpenAPI-generated types
type GetAdventuresRequest = Request;
type GetAdventuresResponse = Response<
  components['schemas']['AdventureListItem'][]
>;

type GetAdventureByIdRequest = Request<{ id: string }>;
type GetAdventureByIdResponse = Response<
  components['schemas']['AdventureListItem']
>;

type BookAdventureRequest = Request<unknown, unknown, components['schemas']['CreateAdventureBookingRequest']>;
// Update the path and method to match your OpenAPI schema, e.g. '/adventure/booking' or similar
type BookAdventureResponse = Response<
  components['schemas']['AdventureBooking']
>;

type GetUserAdventureBookingsRequest = Request;
type GetUserAdventureBookingsResponse = Response<
  { bookings: components['schemas']['AdventureBooking'][] }
>;

export const getAdventures = async (_req: GetAdventuresRequest, res: GetAdventuresResponse, next: NextFunction) => {
  const result = await adventureService.getAdventures();
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

  const payload: components['schemas']['AdventureListItem'][] = result.value.map((adventure: {
    id: string;
    title: string;
    description: string;
    location: string;
    rating: number;
    price: number;
    duration: number | string;
    maxParticipants: number;
    difficulty: string;
    tags: string[];
    thumbnail: string;
  }) => ({
    id: adventure.id,
    name: adventure.title,
    description: adventure.description,
    location: adventure.location,
    rating: adventure.rating,
    price: adventure.price,
    duration: typeof adventure.duration === 'string'
      ? adventure.duration
      : adventure.duration.toString(),
    maxGroupSize: adventure.maxParticipants,
    difficulty: adventure.difficulty,
    tags: adventure.tags,
    image: adventure.thumbnail,
  }));
  res.json(payload);
};

export const getAdventureById = async (req: GetAdventureByIdRequest, res: GetAdventureByIdResponse, next: NextFunction) => {
  const result = await adventureService.getAdventureById(req.params.id);
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
  const payload: components['schemas']['AdventureListItem'] = {
    id: result.value.id,
    name: result.value.title,
    description: result.value.description,
    location: result.value.location,
    rating: result.value.rating,
    price: result.value.price,
    duration: result.value.duration,
    maxGroupSize: result.value.maxParticipants,
    difficulty: result.value.difficulty,
    tags: result.value.tags,
    image: result.value.thumbnail,
  };
  res.json(payload);
};

export const bookAdventure = async (req: BookAdventureRequest, res: BookAdventureResponse, next: NextFunction) => {
  const userId = req.user?.id;
  // Map API type to domain input
  const bookingData = {
    ...req.body,
    userId,
  };
  const result = await adventureBookingService.createBooking(bookingData);
  if (result.ok) {
    // Assert the type of result.value
    const booking = result.value as {
      id: string;
      activityName?: string;
      category?: string;
      date: string;
      time?: string;
      guests?: number;
      participants?: number;
      total?: number;
      rating?: number;
      reviewsCount?: number;
      createdAt: string | Date;
    };
    // The response should match the OpenAPI schema for 201
    const payload: components['schemas']['AdventureBooking'] = {
      bookingId: booking.id,
      activityName: booking.activityName ?? '', // Map or provide fallback
      category: booking.category ?? '',         // Map or provide fallback
      date: booking.date,
      time: booking.time ?? '',                // Map or provide fallback
      participants: booking.guests ?? booking.participants ?? 1,
      total: booking.total ?? 0,
      rating: booking.rating ?? 0,
      reviewsCount: booking.reviewsCount ?? 0,
      createdAt: booking.createdAt instanceof Date
        ? booking.createdAt.toISOString()
        : booking.createdAt,
    };
    return res.status(201).json(payload);
  }
  // Map domain error to ApiError
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
};

export const getUserAdventureBookings = async (req: GetUserAdventureBookingsRequest, res: GetUserAdventureBookingsResponse, next: NextFunction) => {
  const userId = req.user?.id;
  const result = await adventureBookingService.getBookingsForUser(userId);
  if (result.ok) {
    type BookingDomain = {
      id?: string;
      bookingId?: string;
      activityName?: string;
      category?: string;
      date?: string;
      time?: string;
      guests?: number;
      participants?: number;
      total?: number;
      rating?: number;
      reviewsCount?: number;
      createdAt?: string | Date;
    };

    const payload: { bookings: components['schemas']['AdventureBooking'][] } = {
      bookings: result.value.map((booking: BookingDomain) => ({
        bookingId: booking.id ?? booking.bookingId ?? '',
        activityName: booking.activityName ?? '',
        category: booking.category ?? '',
        date: booking.date ?? '',
        time: booking.time ?? '',
        participants: booking.guests ?? booking.participants ?? 1,
        total: booking.total ?? 0,
        rating: booking.rating ?? 0,
        reviewsCount: booking.reviewsCount ?? 0,
        createdAt:
          typeof booking.createdAt === 'object' &&
          booking.createdAt !== null &&
          'toISOString' in booking.createdAt
            ? booking.createdAt.toISOString()
            : booking.createdAt ?? '',
      })),
    };
    return res.status(200).json(payload);
  }
  // Map domain error to ApiError
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
};

// Booking endpoints will be implemented after authentication and Firestore integration
