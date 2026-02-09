import { Booking } from '../models/booking.model';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

export interface BookingRepository {
  getPlaceById(placeId: string): Promise<any>;
  createBooking(newBooking: Booking): Promise<Booking>;
  getAllBookings(): Promise<Booking[]>;
  getUserById(userId: string): Promise<UserRecord>;
}