// adventure.types.ts
export interface Adventure {
  category: string;
  currency: string;
  description: string;
  difficulty: "Beginner" | "Moderate" | "Advanced";
  duration: string;
  highlights: string[];
  id: string;
  included: string[];
  languages: string[];
  location: string;
  maxParticipants: number;
  price: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  thumbnail: string;
  title: string;
}

// Domain model for AdventureBookingListItem
export interface AdventureBookingListItem {
  adventureId: string;
  bookingId: string;
}

// Domain model for CreateAdventureBookingRequest
export interface CreateAdventureBookingRequest {
  adventureId: string;
  date: string; // ISO date string
  guests: number;
  specialRequests?: string;
  time: string; // e.g. '02:00 PM'
}

// Domain model for AdventureBooking
export interface AdventureBooking {
  activityName: string;
  bookingId: string;
  category: string;
  createdAt: string; // ISO 8601
  date: string; // ISO date string
  participants: number;
  rating: number;
  reviewsCount: number;
  time: string; // e.g. '02:00 PM'
  total: number;
}
