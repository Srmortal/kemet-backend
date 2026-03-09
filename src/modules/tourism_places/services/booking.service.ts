import type { DomainError } from "../../../shared/types/domain-error.type.js";
import type { Result } from "../../../shared/types/result.types.js";
import { err, ok } from "../../../shared/types/result.types.js";
//import { generateTourismPrice } from '#app/shared/utils/mock/priceGenerator';
import type {
  CreateTourismBookingRequest,
  TourismBooking,
} from "../port/tourism.types.js";
import type { TourismRepository } from "../port/tourism-repository.js";

export class BookingService {
  private readonly repo: TourismRepository;

  constructor(tourismRepository: TourismRepository) {
    this.repo = tourismRepository;
  }

  async createBooking(
    params: CreateTourismBookingRequest
  ): Promise<Result<TourismBooking, DomainError>> {
    const place = await this.repo.getById(params.siteId);
    if (!place) {
      return err({ type: "NotFound", message: "Tourism place not found" });
    }
    // const safeGov = place.location || 'egypt';
    // const safeTitle = place.title || 'unknown';
    // const priceObj = generateTourismPrice(safeGov, safeTitle);
    // const finalUnitPrice = place.price || priceObj.foreigner;
    // const totalPrice = finalUnitPrice * params.guests;

    const createdBooking = await this.repo.createBooking(params);

    // Optionally, send confirmation email here if you have user info
    // ...

    return ok(createdBooking);
  }

  async getUserBookings(
    _userId: string
  ): Promise<Result<TourismBooking[], DomainError>> {
    try {
      const allBookings = await this.repo.getAllBookings();
      // If TourismBooking has userId, filter; otherwise, adjust as needed
      // return ok(allBookings.filter(b => b.userId === userId));
      return ok(allBookings); // Filtering logic depends on your domain model
    } catch (error) {
      return err({
        type: "Unknown",
        message: `Failed to fetch bookings: ${(error as Error).message}`,
      });
    }
  }
}
