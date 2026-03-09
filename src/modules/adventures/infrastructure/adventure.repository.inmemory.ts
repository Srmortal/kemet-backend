import { adventuresMock } from "#app/shared/utils/mock/mockAdventuresGenerator.js"; // You may need to create or adjust this mock
import type { AdventureRepository } from "../port/adventure.repository.js";
import type { Adventure, AdventureBooking } from "../port/adventure.types.js";
import type { Adventure as AdventureModel } from "./models/adventures.model.js";
import type { AdventureBooking as AdventureBookingModel } from "./models/avdenturesBokking.model.js";

export class AdventureRepositoryInMemory implements AdventureRepository {
  private readonly bookings: AdventureBookingModel[] = [];

  async findById(id: string): Promise<Adventure | null> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const adventure = adventuresMock.find((a) => a.id === id);
    return adventure ? this.mapAdventureModelToDomain(adventure) : null;
  }

  async getAll(): Promise<Adventure[]> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    return adventuresMock.map(this.mapAdventureModelToDomain);
  }

  async create(
    booking: Omit<AdventureBooking, "id">
  ): Promise<AdventureBooking> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const bookingId = `adv-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const bookingModel: AdventureBookingModel = {
      id: bookingId,
      ...booking,
      createdAt: new Date(),
      userId: "",
      adventureId: "",
      guests: 0,
    };
    this.bookings.push(bookingModel);
    return this.mapAdventureBookingModelToDomain(bookingModel);
  }

  async findByUserId(userId: string): Promise<AdventureBooking[]> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const userBookings = this.bookings.filter((b) => b.userId === userId);
    return userBookings.map(this.mapAdventureBookingModelToDomain);
  }

  // Mapping functions
  private mapAdventureModelToDomain(model: AdventureModel): Adventure {
    return {
      id: model.id,
      title: model.title,
      description: model.description,
      location: model.location,
      price: model.price,
      category: model.category,
      currency: model.currency,
      rating: model.rating,
      reviewCount: model.reviewCount,
      duration: model.duration,
      maxParticipants: model.maxParticipants || 0,
      difficulty: model.difficulty || "medium",
      highlights: model.highlights || [],
      included: model.included || [],
      languages: model.languages || [],
      tags: model.tags || [],
      thumbnail: model.thumbnail || "",
    };
  }

  private mapAdventureBookingModelToDomain(
    model: AdventureBookingModel
  ): AdventureBooking {
    return {
      bookingId: model.id,
      date: model.date || new Date().toISOString().split("T")[0],
      participants: model.guests,
      createdAt:
        model.createdAt instanceof Date
          ? model.createdAt.toISOString()
          : model.createdAt,
      activityName: "",
      category: "",
      time: "",
      total: 0,
      rating: 0,
      reviewsCount: 0,
    };
  }
}
