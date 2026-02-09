import { generateTourismPrice } from '@utils/priceGenerator';
import { Booking } from '@models/booking.model';
import { sendBookingConfirmationEmail } from './email.service';
import logger from '@utils/logger';
import type { Result } from '../types/result.types';
import { ok, err } from '../types/result.types';
import type { DomainError } from '../types/domain-error.type';
import type { BookingRepository } from '../ports/booking-repository';

type CreateBookingParams = {
  userId: string;
  placeId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  guests: number;
  specialRequests?: string;
};

export class BookingService {
  constructor(private repo: BookingRepository) {}

  async createBooking(params: CreateBookingParams): Promise<Result<Booking & { id: string }, DomainError>> {
    const { userId, placeId, date, time, guests, specialRequests } = params;

    const place = await this.repo.getPlaceById(placeId);
    if (!place) {
      return err({ type: 'NotFound', message: 'Tourism place not found' });
    }
    const placeData = place;
    
    let governorateSeed = placeData?.governorate;
    if (!governorateSeed && typeof placeData?.location === 'string') {
      governorateSeed = placeData?.location;
    }
    const safeGov = governorateSeed || 'egypt';
    const safeTitle = placeData?.title || 'unknown';

    const priceObj = generateTourismPrice(safeGov, safeTitle);
    
    const finalUnitPrice = placeData?.price || priceObj.foreigner;
    const totalPrice = finalUnitPrice * guests;

    const newBooking: Booking = Object.assign(new Booking(), {
      userId,
      placeId,
      placeTitle: safeTitle,
      date,
      time: time || '09:00 AM',
      guests: guests,
      pricePerPerson: finalUnitPrice,
      totalPrice: totalPrice,
      specialRequests: specialRequests || '',
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const createdBooking = await this.repo.createBooking(newBooking);

    (async () => {
      try {
        const userRecord = await this.repo.getUserById(userId);
        if (userRecord.email) {
          await sendBookingConfirmationEmail({
            email: userRecord.email,
            userName: userRecord.displayName || 'Traveller',
            bookingId: createdBooking.id,
            placeTitle: safeTitle,
            date: date,
            guests: guests,
            totalPrice: totalPrice
          });
        }
      } catch (emailError) {
        logger.warn(`Could not send confirmation email for user ${userId}:`, emailError);
      }
    })().catch(err => logger.error('Unhandled email error:', err));

    return ok(createdBooking as Booking & { id: string });
  }

  async getUserBookings(userId: string): Promise<Result<(Booking & { id: string })[], DomainError>> {
    try {
      const allBookings = await this.repo.getAllBookings();
      const bookings = allBookings.filter(b => b.userId === userId);
      return ok(bookings as (Booking & { id: string })[]);
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to fetch bookings: ${(error as Error).message}` });
    }
  }
}