// Domain model for TourPackageSummary
export interface TourPackageSummary {
  discount: number | undefined;
  id: string;
  image: string;
  location: string;
  name: string;
  pricePerPerson: number;
  rating: number;
}

// Domain model for TourPackageDetail
export interface TourPackageDetail {
  availableLanguages: string[];
  discount: number | undefined;
  duration: string;
  groupSize: { min: number; max: number };
  id: string;
  image: string;
  included: string[];
  itinerary: string[];
  location: string;
  name: string;
  pricePerPerson: number;
  rating: number;
}

// Domain model for CreateTourPackageBookingRequest
export interface CreateTourPackageBookingRequest {
  email: string;
  fullName: string;
  hotelName?: string;
  numberOfPeople: number;
  phoneNumber: string;
  specialRequests?: string;
  tourDate: string;
  tourId: string;
  userId?: string; // Added userId to link booking to a user
}

// Domain model for CreateTourPackageBookingResponse
export interface CreateTourPackageBookingResponse {
  bookingId: string;
  bookingReference: string;
  city: string;
  currentPrice: number;
  difficulty: string;
  discount: number;
  discountPercentage: number;
  durationHours: number;
  guestEmail: string;
  guestName: string;
  guestPhone: string;
  included: string[];
  message: string;
  numberOfPeople: number;
  pickupTime: string;
  status: "confirmed" | "pending";
  totalAmount: number;
  tourDate: string;
  tourId: string;
  tourName: string;
}
