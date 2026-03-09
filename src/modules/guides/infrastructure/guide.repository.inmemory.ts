import { mockGuides } from "#app/shared/utils/mock/generateMockGuides.js";
import type {
  CreateGuideBookingRequest,
  Guide,
  GuideBooking,
} from "../port/guide.types.js";
import type { GuideRepository } from "../port/guide-repository.js";
import type { Guide as GuideModel } from "./models/guide.model.js";
import type { GuideBooking as GuideBookingModel } from "./models/guide-booking.model.js";

export class GuideRepositoryInMemory implements GuideRepository {
  private readonly bookings: GuideBookingModel[] = [];

  async getAllGuides(): Promise<Guide[]> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    // Map infrastructure models to domain models
    return mockGuides.map(this.mapGuideModelToDomain);
  }

  async getGuideById(id: string): Promise<Guide | null> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const guideModel = mockGuides.find((g) => g.id === id);
    return guideModel ? this.mapGuideModelToDomain(guideModel) : null;
  }

  async isGuideAvailable(
    guideId: string,
    date: string,
    startTime: string,
    hours: number
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    // Find bookings for this guide on the same date
    const guideBookings = this.bookings.filter(
      (b) => b.guideId === guideId && b.date === date
    );

    // Convert startTime to minutes for comparison
    const reqStart = Number.parseInt(startTime.replace(":", ""), 10);
    const reqEnd = reqStart + hours * 100; // crude, assumes "HHmm" format

    // Check for time overlap with any existing booking
    for (const booking of guideBookings) {
      const bookingStart = Number.parseInt(
        booking.startTime.replace(":", ""),
        10
      );
      const bookingEnd = bookingStart + booking.hours * 100;
      // Overlap if requested start < existing end and requested end > existing start
      if (reqStart < bookingEnd && reqEnd > bookingStart) {
        return false;
      }
    }
    return true;
  }

  async createGuideBooking(
    bookingData: CreateGuideBookingRequest
  ): Promise<GuideBooking> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    // Calculate payment (stub, replace with real logic)
    const guideService = 100 * bookingData.hours; // Example calculation
    const total = guideService;

    // Generate a simple booking reference
    const bookingReference = `mem-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

    // Map domain booking request to infrastructure model
    const bookingModel: GuideBookingModel = {
      id: bookingReference,
      ...bookingData,
      totalPaid: total,
      paymentSummary: { guideService, total },
      createdAt: Date.now(),
    };

    this.bookings.push(bookingModel);
    // Map infrastructure model to domain model
    return this.mapGuideBookingModelToDomain(bookingModel);
  }

  // Mapping functions
  private mapGuideModelToDomain(model: GuideModel): Guide {
    // Map GuideModel to Guide, ensuring specialties is mapped from specializations
    return {
      id: model.id,
      name: model.name,
      rating: model.rating,
      reviews: model.reviews,
      languages: model.languages,
      specialties: model.specializations ?? [],
    };
  }

  private mapGuideBookingModelToDomain(model: GuideBookingModel): GuideBooking {
    // Map infrastructure model to domain model, including required properties
    return {
      bookingReference: model.id ?? "",
      guide: (() => {
        const foundGuide = mockGuides.find((g) => g.id === model.guideId);
        if (!foundGuide) {
          throw new Error(`Guide with id ${model.guideId} not found`);
        }
        return this.mapGuideModelToDomain(foundGuide);
      })(),
      date: model.date,
      people: model.people,
      totalPaid: model.totalPaid,
      paymentSummary: model.paymentSummary,
    };
  }
}
