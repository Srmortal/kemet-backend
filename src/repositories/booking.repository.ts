import { FirestoreOrm } from '@infrastructure/firestore/firestoreOrm';
import { Booking } from '../models/booking.model';
import { firebaseAdmin } from '../config/firebase';
import type { BookingRepository as BookingRepositoryPort } from '../ports/booking-repository';

const bookingOrm = FirestoreOrm.fromModel(Booking);
const auth = firebaseAdmin.auth();

export class BookingRepository implements BookingRepositoryPort {
  async getPlaceById(placeId: string) {
    // Use FirestoreOrm to query the tourism_sites collection
    const tourismSitesOrm = new FirestoreOrm<{
      id: string;
      title: string;
      location?: string;
      governorate?: string;
      price?: number;
    }>('tourism_sites');
    return tourismSitesOrm.getById(placeId);
  }

  async createBooking(newBooking: Booking) {
    return bookingOrm.create(newBooking);
  }

  async getAllBookings() {
    return bookingOrm.getAll();
  }

  async getUserById(userId: string) {
    return auth.getUser(userId);
  }
}

export const bookingRepository = new BookingRepository();
