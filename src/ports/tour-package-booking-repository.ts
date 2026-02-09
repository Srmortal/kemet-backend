import { TourPackageBooking } from '../models/tourPackageBooking.model';

export interface TourPackageBookingRepository {
  createBooking(booking: Omit<TourPackageBooking, 'id'>): Promise<TourPackageBooking>;
  getAllBookings(): Promise<TourPackageBooking[]>;
  findById(id: string): Promise<TourPackageBooking | null>;
}