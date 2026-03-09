// src/services/tourPackageBooking.service.ts

import type { DomainError } from "#app/shared/types/domain-error.type.js";
import { err, ok, type Result } from "../../../shared/types/result.types.js";
import type { TourPackageRepository } from "../port/tour-package-repository.js";
import type {
  CreateTourPackageBookingRequest,
  CreateTourPackageBookingResponse,
} from "../port/tourPackage.types.js";

export class TourPackageBookingService {
  readonly packageRepo: TourPackageRepository;

  constructor(packageRepo: TourPackageRepository) {
    this.packageRepo = packageRepo;
  }

  async bookTourPackage(
    input: CreateTourPackageBookingRequest
  ): Promise<Result<CreateTourPackageBookingResponse, DomainError>> {
    const maybeTourPackage = await this.packageRepo.getById(input.tourId);
    if (!maybeTourPackage) {
      return err({ type: "NotFound", message: "Tour package not found" });
    }
    // Use only domain models
    // For this booking, we assume maybeTourPackage is a TourPackageDetail (domain model)
    // If your repo returns a different shape, adjust accordingly
    const tourPackage = maybeTourPackage;

    // For demo, pricePerPerson and discount are from the domain model
    const pricePerPerson = tourPackage.pricePerPerson;
    const discount = tourPackage.discount ?? 0;
    const totalAmount = pricePerPerson * input.numberOfPeople;
    const currentPrice = totalAmount - discount;
    const discountPercentage =
      discount > 0 ? (discount / totalAmount) * 100 : 0;

    try {
      await this.packageRepo.createBooking(input);
      // Simulate a bookingId and bookingReference for demo
      const bookingId = `${input.tourId}-${Date.now()}`;
      return ok({
        bookingId,
        bookingReference: bookingId,
        status: "confirmed",
        message: "Booking successful",
        tourId: tourPackage.id,
        tourName: tourPackage.name,
        tourDate: input.tourDate,
        pickupTime: "",
        durationHours: 0,
        difficulty: "",
        city: "",
        included: tourPackage.included ?? [],
        numberOfPeople: input.numberOfPeople,
        guestName: input.fullName,
        guestEmail: input.email,
        guestPhone: input.phoneNumber,
        totalAmount,
        discount,
        currentPrice,
        discountPercentage,
      });
    } catch (e: unknown) {
      return err(e as DomainError);
    }
  }
}
