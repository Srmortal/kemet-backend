import { FirestoreOrm } from '@infrastructure/firestore/firestoreOrm';
import { AdventureBooking } from '../models/avdenturesBokking.model';
import type { AdventureBookingRepository as AdventureBookingRepositoryPort } from '../ports/adventure-booking-repository';

const adventureBookingOrm = FirestoreOrm.fromModel(AdventureBooking);

export class AdventureBookingRepository implements AdventureBookingRepositoryPort {
  async create(booking: Omit<AdventureBooking, 'id'>) {
    return adventureBookingOrm.create(booking);
  }

  async findByUserId(userId: string) {
    return adventureBookingOrm.find({ userId });
  }
}

export const adventureBookingRepository = new AdventureBookingRepository();
