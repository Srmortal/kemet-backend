import { Guide } from "@models/guide.model";
import { Result,ok,err } from "../types/result.types";
import { DomainError } from "types/domain-error.type";
import type { GuideRepository } from "../ports/guide-repository";

export class GuideService {
  constructor(private repo: GuideRepository) {}

  async bookGuide(
    req: {
      guideId: string;
      date: string;
      startTime: string;
      hours: number;
      people: number;
      fullName: string;
      email: string;
      phone: string;
    }
  ): Promise<Result<{
    bookingReference: string;
    guide: Guide;
    date: string;
    people: number;
    totalPaid: number;
    paymentSummary: { guideService: number; total: number };
  }>> {
    try {
      const guide = await this.repo.getGuideById(req.guideId);
      if (!guide) {
        return err({ type: 'NotFound', message: `Guide with id ${req.guideId} not found` });
      }
      const available = await this.repo.isGuideAvailable(req.guideId, req.date, req.startTime, req.hours);
      if (!available) {
        return err({ type: 'Conflict', message: 'Guide not available for selected date/time' });
      }
      const booking = await this.repo.createGuideBooking(req);
      if (!booking.bookingReference) {
        return err({ type: 'Unknown', message: 'Booking reference could not be generated' });
      }
      return ok({
        bookingReference: booking.bookingReference,
        guide,
        date: booking.date,
        people: booking.people,
        totalPaid: booking.totalPaid,
        paymentSummary: booking.paymentSummary,
      });
    } catch (error) {
      return err({ type: 'Unknown', message: (error as Error).message });
    }
  }

  async getGuides(
    params: { page: number; limit: number }
  ): Promise<Result<{ guides: Guide[]; total: number; totalPages: number }>> {
    try {
      const allGuides = await this.repo.getAllGuides();
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

  async getGuideById(
    id: string
  ): Promise<Result<Guide>> {
    try {
      const guide = await this.repo.getGuideById(id);
      if (!guide) {
        return err({
          type: 'NotFound',
          message: `Guide with id ${id} not found`
        });
      }
      return ok(guide);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
