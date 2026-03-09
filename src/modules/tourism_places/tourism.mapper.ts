import type { components } from "./dtos/generated.js";
import type {
  CreateTourismBookingRequest,
  TourismBooking,
  TourismCategory,
  TourismLocation,
  TourismPlace,
} from "./port/tourism.types.js";

// Domain to API TourismPlace schema
export function toTourismPlace(
  place: TourismPlace
): components["schemas"]["TourismPlace"] {
  return {
    id: place.id,
    title: place.title,
    description: place.description,
    location: place.location,
    coordinates: {
      latitude: place.coordinates.latitude,
      longitude: place.coordinates.longitude,
    },
    category: place.category,
    rating: place.rating,
    price: place.price,
    address: place.address,
    reviewsCount: place.reviewsCount,
    isOpen: place.isOpen,
    hours: {
      open: place.hours.open,
      close: place.hours.close,
    },
    features: place.features,
    image: place.image,
  };
}

// API request to domain for CreateBookingRequest
export function fromCreateTourismBookingRequest(
  req: components["schemas"]["CreateBookingRequest"],
  siteId: string
): CreateTourismBookingRequest {
  const result: CreateTourismBookingRequest = {
    siteId,
    date: req.date,
    guests: req.guests,
    time: req.time,
  };
  if (req.specialRequests !== undefined) {
    result.specialRequests = req.specialRequests;
  }
  return result;
}

// Domain to API TourismBooking schema
export function toTourismBooking(
  booking: TourismBooking
): components["schemas"]["TourismBooking"] {
  const result: components["schemas"]["TourismBooking"] = {
    bookingId: booking.bookingId,
    siteId: booking.siteId,
    date: booking.date,
    guests: booking.guests,
    time: booking.time,
  };
  if (booking.specialRequests !== undefined) {
    result.specialRequests = booking.specialRequests;
  }
  return result;
}

// Map a location string to API schema
export function toTourismLocation(location: string): TourismLocation {
  return { location };
}

// Map a category string to API schema
export function toTourismCategory(category: string): TourismCategory {
  return { category };
}

// Map an array of domain bookings to API bookings
export function toTourismBookings(
  bookings: TourismBooking[]
): components["schemas"]["TourismBooking"][] {
  return bookings.map(toTourismBooking);
}

// Map service result to GetPlacesRes (for controller simplification)
export function toTourismPlacesRes(value: {
  data?: TourismPlace[];
  pagination?: { total?: number; page?: number; limit?: number };
  filters?: Record<string, unknown>;
}): {
  items: components["schemas"]["TourismPlace"][];
  total: number;
  page: number;
  limit: number;
  filters: Record<string, unknown>;
} {
  return {
    items: value.data?.map(toTourismPlace) ?? [],
    total: value.pagination?.total ?? 0,
    page: value.pagination?.page ?? 1,
    limit: value.pagination?.limit ?? 10,
    filters: value.filters ?? {},
  };
}
