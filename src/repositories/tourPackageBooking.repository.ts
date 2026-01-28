import { FirestoreOrm } from '@infrastructure/firestore/firestoreOrm';
import { TourPackageBooking } from '../models/tourPackageBooking.model';

const tourPackageBookingOrm = FirestoreOrm.fromModel(TourPackageBooking);

export class TourPackageBookingRepository {
  async createBooking(booking: Omit<TourPackageBooking, 'id'>): Promise<TourPackageBooking> {
    return tourPackageBookingOrm.create(booking);
  }

  async getAllBookings(): Promise<TourPackageBooking[]> {
    return tourPackageBookingOrm.getAll();
  }

  async findById(id: string): Promise<TourPackageBooking | null> {
    return tourPackageBookingOrm.getById(id);
  }
}
export const tourPackageBookingRepository = new TourPackageBookingRepository();