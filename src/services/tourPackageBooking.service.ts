// src/services/tourPackageBooking.service.ts
import { tourPackageBookingRepository } from '@repositories/tourPackageBooking.repository';
import { Result, ok, err } from '../types/result.types';
import { DomainError } from 'types/domain-error.type';
import { tourPackageRepository } from '@repositories/tourPackage.repository';

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

export async function bookTourPackage(
  input: TourPackageBookingInput,
): Promise<Result<TourPackageBookingResult, DomainError>> {
  const adventure = await tourPackageRepository.getById(input.tourPackageId);
  if (!adventure) {
    return err({ type: 'NotFound', message: 'Adventure not found' });
  }

  const total = adventure.pricePerPerson * input.numberOfPeople;
  try {
    const booking = await tourPackageBookingRepository.createBooking({
      packageId: input.tourPackageId,
      date: input.tourDate,
      guests: input.numberOfPeople,
      userId: input.email, // or use a real userId if available
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Optionally add hotelName, specialRequests, phoneNumber, fullName, total, adventureTitle as custom fields if model is extended
    });

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