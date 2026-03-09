// Domain model for Guide (as used in mapping)
export interface Guide {
  id: string;
  languages: string[];
  name: string;
  rating: number;
  reviews: number;
  specialties: string[];
}

// Domain model for CreateGuideBookingRequest
export interface CreateGuideBookingRequest {
  date: string;
  email: string;
  fullName: string;
  guideId: string;
  hours: number;
  people: number;
  phone: string;
  startTime: string;
}

// Domain model for GuideBooking
export interface GuideBooking {
  bookingReference: string;
  date: string;
  guide: Guide;
  paymentSummary?: { guideService: number; total: number };
  people: number;
  totalPaid: number;
}

// Domain model for Tour (as used in mapping)
export interface Tour {
  description: string;
  durationHours: number;
  maxPeople: number;
  name: string;
  price: number;
}
