import { AdventureBooking } from '../models/avdenturesBokking.model';

export interface AdventureBookingRepository {
  create(booking: Omit<AdventureBooking, 'id'>): Promise<AdventureBooking>;
  findByUserId(userId: string): Promise<AdventureBooking[]>;
}