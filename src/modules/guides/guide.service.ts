import type { DomainError } from "#app/shared/types/domain-error.type.js";
import { err, ok, type Result } from "../../shared/types/result.types.js";
import type {
  CreateGuideBookingRequest,
  Guide,
  GuideBooking,
} from "./port/guide.types.js";
import type { GuideRepository } from "./port/guide-repository.js";
export class GuideService {
  private readonly guideRepository: GuideRepository;

  constructor(guideRepository: GuideRepository) {
    this.guideRepository = guideRepository;
  }

  async bookGuide(
    req: CreateGuideBookingRequest
  ): Promise<Result<GuideBooking>> {
    try {
      const guide = await this.guideRepository.getGuideById(req.guideId);
      if (!guide) {
        return err({
          type: "NotFound",
          message: `Guide with id ${req.guideId} not found`,
        });
      }
      const available = await this.guideRepository.isGuideAvailable(
        req.guideId,
        req.date,
        req.startTime,
        req.hours
      );
      if (!available) {
        return err({
          type: "Conflict",
          message: "Guide not available for selected date/time",
        });
      }
      const booking = await this.guideRepository.createGuideBooking(req);
      if (!booking.bookingReference) {
        return err({
          type: "Unknown",
          message: "Booking reference could not be generated",
        });
      }
      return ok(booking);
    } catch (error) {
      return err({ type: "Unknown", message: (error as Error).message });
    }
  }

  async getGuides(params: {
    page: number;
    limit: number;
  }): Promise<Result<{ guides: Guide[]; total: number; totalPages: number }>> {
    try {
      const allGuides = await this.guideRepository.getAllGuides();
      const total = allGuides.length;
      const page = params.page;
      const limit = params.limit;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const guides = allGuides.slice(start, end);
      return ok({ guides, total, totalPages });
    } catch (error) {
      return err(error as DomainError);
    }
  }

  async getGuideById(id: string): Promise<Result<Guide>> {
    try {
      const guide = await this.guideRepository.getGuideById(id);
      if (!guide) {
        return err({
          type: "NotFound",
          message: `Guide with id ${id} not found`,
        });
      }
      return ok(guide);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
