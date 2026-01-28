import { FirestoreOrm } from '@infrastructure/firestore/firestoreOrm';
import { AdventureBooking } from '../models/avdenturesBokking.model';

const adventureBookingOrm = FirestoreOrm.fromModel(AdventureBooking);

export class AdventureBookingRepository {
  async create(booking: Omit<AdventureBooking, 'id'>) {
    return adventureBookingOrm.create(booking);
  }

  async findByUserId(userId: string) {
    return adventureBookingOrm.find({ userId });
  }
}

export const adventureBookingRepository = new AdventureBookingRepository();
