import { generateMockTourismPlaces } from "../../../shared/utils/mock/mockTourismPlaces.js";
import type {
  CreateTourismBookingRequest,
  GetPlacesParams,
  TourismBooking,
  TourismPlace,
} from "../port/tourism.types.js";
import type { TourismRepository } from "../port/tourism-repository.js";
import type { Booking } from "./models/booking.model.js";
import type { TourismPlace as TourismPlaceInfra } from "./models/tourismPlace.model.js";

// Generate infra mock data
const MOCK_PLACES_INFRA: TourismPlaceInfra[] = generateMockTourismPlaces(50);

// Regex patterns
const SORT_PREFIX_REGEX = /^-/;

// --- Mapping functions ---

// Infra → Domain
function infraToDomainPlace(infra: TourismPlaceInfra): TourismPlace {
  return {
    id: infra.id || "",
    title: infra.title,
    description: infra.description ?? "",
    location: infra.location ?? "",
    coordinates: {
      latitude: infra.coordinates?.latitude || 0,
      longitude: infra.coordinates?.longitude || 0,
    },
    category: infra.category || "general",
    rating: infra.rating || 0,
    price: infra.price || 0,
    address: infra.location ?? "",
    reviewsCount: infra.rating || 0,
    isOpen: false,
    hours: {
      open: "",
      close: "",
    },
    features: [],
    image: "",
  };
}

// Domain → Infra (for booking, if needed)
function domainToInfraBooking(
  domain: CreateTourismBookingRequest,
  bookingId: string
): Booking {
  return {
    id: bookingId,
    placeId: domain.siteId,
    userId: "mock-user-id",
    placeTitle: "Mock Place Title",
    pricePerPerson: 0,
    totalPrice: 0,
    date: domain.date,
    guests: domain.guests,
    time: domain.time,
    specialRequests: domain.specialRequests ?? "",
    status: "confirmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Infra → Domain (for booking)
function infraToDomainBooking(infra: Booking): TourismBooking {
  return {
    bookingId: infra.id,
    siteId: infra.placeId,
    date: infra.date,
    guests: infra.guests,
    time: infra.time ?? "",
    specialRequests: infra.specialRequests ?? "",
  };
}

export class TourismRepositoryMock implements TourismRepository {
  private readonly placesInfra: TourismPlaceInfra[] = MOCK_PLACES_INFRA;
  private readonly bookingsInfra: Booking[] = [];

  queryBuilder(): unknown {
    return null;
  }

  async getById(id: string): Promise<TourismPlace | null> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const infra = this.placesInfra.find((place) => place.id === id);
    return infra ? infraToDomainPlace(infra) : null;
  }

  async getAll(): Promise<TourismPlace[]> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    return this.placesInfra.map(infraToDomainPlace);
  }

  enrichPlaceData(place: TourismPlace): TourismPlace {
    // No enrichment for mock
    return place;
  }

  async getPlacesWithFilters(
    params: GetPlacesParams & { pageNum: number; pageSize: number }
  ): Promise<{ places: TourismPlace[]; totalCount: number }> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    let filtered = this.placesInfra;

    if (params.location) {
      filtered = filtered.filter((p) => p.location === params.location);
    }
    if (params.category) {
      filtered = filtered.filter((p) => p.category === params.category);
    }

    // Simple sort (by price, rating, etc.)
    if (params.sortBy) {
      const field = params.sortBy.replace(SORT_PREFIX_REGEX, "");
      const dir = params.sortBy.startsWith("-") ? -1 : 1;
      filtered = filtered.sort((a: TourismPlaceInfra, b: TourismPlaceInfra) => {
        const aVal = (a as Record<string, unknown>)[field] as
          | number
          | string
          | undefined;
        const bVal = (b as Record<string, unknown>)[field] as
          | number
          | string
          | undefined;
        if (aVal === undefined && bVal === undefined) {
          return 0;
        }
        if (aVal === undefined) {
          return 1 * dir;
        }
        if (bVal === undefined) {
          return -1 * dir;
        }
        if (aVal < bVal) {
          return -1 * dir;
        }
        if (aVal > bVal) {
          return 1 * dir;
        }
        return 0;
      });
    }

    const totalCount = filtered.length;
    const start = (params.pageNum - 1) * params.pageSize;
    const end = start + params.pageSize;
    const places = filtered.slice(start, end).map(infraToDomainPlace);

    return { places, totalCount };
  }

  async createBooking(
    newBooking: CreateTourismBookingRequest
  ): Promise<TourismBooking> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const bookingId = (this.bookingsInfra.length + 1).toString();
    const infra = domainToInfraBooking(newBooking, bookingId);
    this.bookingsInfra.push(infra);
    return infraToDomainBooking(infra);
  }

  async getAllBookings(): Promise<TourismBooking[]> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    return this.bookingsInfra.map(infraToDomainBooking);
  }
}
