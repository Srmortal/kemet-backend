import type { DomainError } from "../../../shared/types/domain-error.type.js";
import type { Result } from "../../../shared/types/result.types.js";
import { err, ok } from "../../../shared/types/result.types.js";
import type { AdventureRepository } from "../port/adventure.repository.js";
import type {
  AdventureBooking,
  CreateAdventureBookingRequest,
} from "../port/adventure.types.js";

export class AdventureBookingService {
  private readonly adventureRepo: AdventureRepository;

  constructor(adventureRepo: AdventureRepository) {
    this.adventureRepo = adventureRepo;
  }

  async createBooking(
    booking: CreateAdventureBookingRequest
  ): Promise<Result<AdventureBooking, DomainError>> {
    try {
      const adventure = await this.adventureRepo.findById(booking.adventureId);
      if (!adventure) {
        return err({ type: "NotFound", message: "Adventure not found" });
      }
      const total = adventure.price * booking.guests;
      const createdAt = new Date().toISOString();
      // Compose domain booking
      const domainBooking: AdventureBooking = {
        bookingId: "", // Should be set by repo or persistence layer
        activityName: adventure.title,
        category: adventure.category,
        date: booking.date,
        time: booking.time,
        participants: booking.guests,
        total,
        rating: adventure.rating,
        reviewsCount: adventure.reviewCount,
        createdAt,
      };
      // Persist booking (repo may return with bookingId set)
      const created = await this.adventureRepo.create({
        ...domainBooking,
      } as Omit<AdventureBooking, "id">);
      const resultBooking = { ...domainBooking, bookingId: created.bookingId };
      return ok(resultBooking);
    } catch {
      return err({ type: "Unknown", message: "Failed to create booking" });
    }
  }

  async getBookingsForUser(
    userId: string
  ): Promise<Result<AdventureBooking[], DomainError>> {
    try {
      const all = await this.adventureRepo.findByUserId(userId);
      return ok(all);
    } catch {
      return err({ type: "Unknown", message: "Failed to fetch bookings" });
    }
  }
}
