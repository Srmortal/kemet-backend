import { Guide } from "@models/guide.model";
import { Result,ok,err } from "../types/result.types";
import { guideRepository } from "@repositories/guide.repository";
import { DomainError } from "types/domain-error.type";

// Book a guide (pure business logic, TDD)
export async function bookGuide(
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
    const guide = await guideRepository.getGuideById(req.guideId);
    if (!guide) {
      return err({ type: 'NotFound', message: `Guide with id ${req.guideId} not found` });
    }
    // Check guide availability (stub, replace with real logic)
    const available = await guideRepository.isGuideAvailable(req.guideId, req.date, req.startTime, req.hours);
    if (!available) {
      return err({ type: 'Conflict', message: 'Guide not available for selected date/time' });
    }
    // Create booking (stub, replace with real logic)
    const booking = await guideRepository.createGuideBooking(req);
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
// Service contract
export async function getGuides(
  params: { page: number; limit: number }
): Promise<Result<{ guides: Guide[]; total: number; totalPages: number }>> {
  try {
    const allGuides = await guideRepository.getAllGuides();
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

export async function getGuideById(
  id: string
): Promise<Result<Guide>> {
  try {
    const guide = await guideRepository.getGuideById(id);
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
