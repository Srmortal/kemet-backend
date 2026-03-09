// adventure.mapper.ts
import type { components } from "./dtos/generated.js";
import type {
  Adventure,
  AdventureBooking,
  AdventureBookingListItem,
  CreateAdventureBookingRequest,
} from "./port/adventure.types.js";

export function toAdventureListItem(
  adventure: Adventure
): components["schemas"]["AdventureListItem"] {
  return {
    id: adventure.id,
    name: adventure.title,
    description: adventure.description,
    location: adventure.location,
    rating: adventure.rating,
    price: adventure.price,
    duration: adventure.duration,
    maxGroupSize: adventure.maxParticipants,
    difficulty: adventure.difficulty,
    tags: adventure.tags,
    image: adventure.thumbnail,
  };
}

// Map domain model to AdventureBookingListItem schema
export function toAdventureBookingListItem(
  booking: AdventureBookingListItem
): components["schemas"]["AdventureBookingListItem"] {
  return {
    bookingId: booking.bookingId,
    adventureId: booking.adventureId,
  };
}

// Map API request to domain model for CreateBookingRequest
export function fromCreateAdventureBookingRequest(
  req: components["schemas"]["CreateBookingRequest"],
  adventureId: string
): CreateAdventureBookingRequest {
  const result: {
    adventureId: string;
    date: string;
    time: string;
    guests: number;
    specialRequests?: string;
  } = {
    adventureId,
    date: req.date,
    time: req.time,
    guests: req.guests,
  };
  if (req.specialRequests !== undefined) {
    result.specialRequests = req.specialRequests;
  }
  return result;
}

// Map domain model to AdventureBooking schema
export function toAdventureBooking(
  booking: AdventureBooking
): components["schemas"]["AdventureBooking"] {
  return {
    bookingId: booking.bookingId,
    activityName: booking.activityName,
    category: booking.category,
    date: booking.date,
    time: booking.time,
    participants: booking.participants,
    total: booking.total,
    rating: booking.rating,
    reviewsCount: booking.reviewsCount,
    createdAt: booking.createdAt,
  };
}
