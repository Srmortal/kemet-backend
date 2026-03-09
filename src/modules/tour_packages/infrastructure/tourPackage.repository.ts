import { generateMockTourPackages } from "#app/shared/utils/mock/mockTourPackages.js";
import type { TourPackageRepository as TourPackageRepositoryPort } from "../port/tour-package-repository.js";
import type {
  CreateTourPackageBookingRequest,
  CreateTourPackageBookingResponse,
} from "../port/tourPackage.types.js";
import type { TourPackageBooking } from "./models/tourPackageBooking.model.js";

export type TourPackage = ReturnType<typeof generateMockTourPackages>[number];
const tourPackages: TourPackage[] = generateMockTourPackages(20);

// In-memory storage for bookings
const bookingsStore: Map<string, TourPackageBooking> = new Map();
let bookingCounter = 1;

export class TourPackageRepository implements TourPackageRepositoryPort {
  async createBooking(
    booking: CreateTourPackageBookingRequest
  ): Promise<CreateTourPackageBookingResponse> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    if (!booking.userId) {
      throw new Error("userId is required");
    }

    const id = `${bookingCounter++}`;
    const bookingData: TourPackageBooking = {
      id,
      userId: booking.userId,
      packageId: booking.tourId,
      guests: booking.numberOfPeople,
      date: booking.tourDate,
    };

    bookingsStore.set(id, bookingData);
    return this.mapBookingToPortType(bookingData);
  }

  async getAllBookings(): Promise<CreateTourPackageBookingResponse[]> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const bookings = Array.from(bookingsStore.values());
    return bookings.map((booking) => this.mapBookingToPortType(booking));
  }

  async findById(id: string): Promise<CreateTourPackageBookingResponse | null> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const booking = bookingsStore.get(id);
    return booking ? this.mapBookingToPortType(booking) : null;
  }

  async getAll(options: { category?: string; page?: number; limit?: number }) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    let result = tourPackages;
    if (options.category) {
      result = result.filter((pkg) => pkg.category === options.category);
    }
    if (options.page && options.limit) {
      const start = (options.page - 1) * options.limit;
      result = result.slice(start, start + options.limit);
    }
    return result;
  }

  async getById(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    return tourPackages.find((pkg) => pkg.id === id);
  }

  private mapBookingToPortType(
    booking: TourPackageBooking
  ): CreateTourPackageBookingResponse {
    return {
      bookingId: booking.id || "",
      bookingReference: `BK-${booking.id}`,
      status: "confirmed",
      message: "Booking created successfully",
      tourId: booking.packageId,
      tourName: "",
      tourDate: booking.date,
      pickupTime: "",
      durationHours: 0,
      difficulty: "",
      city: "",
      included: [],
      numberOfPeople: booking.guests,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      totalAmount: 0,
      discount: 0,
      currentPrice: 0,
      discountPercentage: 0,
    };
  }
}
