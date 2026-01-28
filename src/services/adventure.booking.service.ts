import { adventureBookingRepository } from '@repositories/adventureBooking.repository';
import { adventureRepository } from '@repositories/adventure.repository';
import { ok, err } from '../types/result.types';
import type { Result } from '../types/result.types';
import type { DomainError } from '../types/domain-error.type';
import { AdventureBooking } from '@models/avdenturesBokking.model';


export class AdventureBookingService {
  /**
   * Create a new adventure booking.
   * @param booking - AdventureBooking (input object)
   * @returns Result<AdventureBooking>
   */
  async createBooking(booking: Omit<AdventureBooking, 'id' | 'createdAt'>): Promise<Result<unknown, DomainError>> {
    try {
      const bookingWithDate: Omit<AdventureBooking, 'id'> = {
        ...booking,
        createdAt: new Date(),
      };
      const created = await adventureBookingRepository.create(bookingWithDate);
      const adventure = await adventureRepository.findById(booking.adventureId);
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

  /**
   * Get all adventure bookings for a user.
   * @param userId - string
   * @returns Result<AdventureBooking[]>
   */
  async getBookingsForUser(userId: string): Promise<Result<AdventureBooking[], DomainError>> {
    try {
      const all = await adventureBookingRepository.findByUserId(userId);
      return ok(all);
    } catch (error) {
      return err({ type: 'Unknown', message: 'Failed to fetch bookings' });
    }
  }
}

export const adventureBookingService = new AdventureBookingService();