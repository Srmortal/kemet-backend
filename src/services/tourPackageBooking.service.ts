// src/services/tourPackageBooking.service.ts
import { Result, ok, err } from '../types/result.types';
import { DomainError } from 'types/domain-error.type';
import type { TourPackageBookingRepository } from '../ports/tour-package-booking-repository';
import type { TourPackageRepository } from '../ports/tour-package-repository';

type TourPackageBookingInput = {
  tourPackageId: string;
  tourDate: string;
  numberOfPeople: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  hotelName?: string;
  specialRequests?: string;
};

type TourPackageBookingResult = {
  bookingId: string;
  status: 'confirmed' | 'pending';
  message: string;
  total: number;
};

export class TourPackageBookingService {
  constructor(
    private bookingRepo: TourPackageBookingRepository,
    private packageRepo: TourPackageRepository
  ) {}

  async bookTourPackage(
    input: TourPackageBookingInput,
  ): Promise<Result<TourPackageBookingResult, DomainError>> {
    const adventure = await this.packageRepo.getById(input.tourPackageId);
    if (!adventure) {
      return err({ type: 'NotFound', message: 'Adventure not found' });
    }

    const total = adventure.pricePerPerson * input.numberOfPeople;
    try {
      const booking = await this.bookingRepo.createBooking({
        packageId: input.tourPackageId,
        date: input.tourDate,
        guests: input.numberOfPeople,
        userId: input.email, 
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      if (!booking.id) {
        return err({ type: 'Unknown', message: 'Booking ID is missing' });
      }

      return ok({
        bookingId: booking.id,
        status: booking.status as 'confirmed' | 'pending',
        message: 'Booking created successfully',
        total
      });
    } catch (e: unknown) {
      return err(e as DomainError);
    }
  }
}