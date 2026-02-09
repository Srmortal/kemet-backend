import { ok, err } from '../types/result.types';
import type { Result } from '../types/result.types';
import type { DomainError } from '../types/domain-error.type';
import Joi from 'joi';
import { AdventureBooking } from '@models/avdenturesBokking.model';
import type { AdventureBookingRepository } from '../ports/adventure-booking-repository';
import type { AdventureRepository } from '../ports/adventure-repository';

const adventureBookingSchema = Joi.object({
  userId: Joi.string().required(),
  adventureId: Joi.string().required(),
  guests: Joi.number().integer().min(1).required(),
  date: Joi.date().iso().required(),
});

export class AdventureBookingService {
  constructor(
    private bookingRepo: AdventureBookingRepository,
    private adventureRepo: AdventureRepository
  ) {}

  async createBooking(booking: Omit<AdventureBooking, 'id' | 'createdAt'>): Promise<Result<unknown, DomainError>> {
    const { error } = adventureBookingSchema.validate(booking);
    if (error) {
      return err({ type: 'ValidationError', message: error.message });
    }
    try {
      const bookingWithDate: Omit<AdventureBooking, 'id'> = {
        ...booking,
        createdAt: new Date(),
      };
      const created = await this.bookingRepo.create(bookingWithDate);
      const adventure = await this.adventureRepo.findById(booking.adventureId);
      const combined = {
        ...created,
        activityName: adventure?.title,
        category: adventure?.category,
        total: adventure ? adventure.price * booking.guests : undefined,
        rating: adventure?.rating,
        reviewsCount: adventure?.reviewCount,
      }
      return ok(combined);
    } catch (error) {
      return err({ type: 'Unknown', message: 'Failed to create booking' });
    }
  }

  async getBookingsForUser(userId: string): Promise<Result<AdventureBooking[], DomainError>> {
    try {
      const all = await this.bookingRepo.findByUserId(userId);
      return ok(all);
    } catch (error) {
      return err({ type: 'Unknown', message: 'Failed to fetch bookings' });
    }
  }
}