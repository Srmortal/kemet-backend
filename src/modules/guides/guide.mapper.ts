import type { components } from "./dtos/generated.js";
import type {
  CreateGuideBookingRequest,
  Guide,
  GuideBooking,
  Tour,
} from "./port/guide.types.js";

// Domain to API Guide schema
export function toGuide(guide: Guide): components["schemas"]["Guide"] {
  return {
    id: guide.id,
    name: guide.name,
    rating: guide.rating,
    reviews: guide.reviews,
    languages: guide.languages,
    specializations: guide.specialties,
  };
}

// API request to domain for CreateGuideBookingRequest
export function fromCreateGuideBookingRequest(
  req: components["schemas"]["CreateGuideBookingRequest"],
  guideId: string
): CreateGuideBookingRequest {
  return {
    guideId,
    date: req.date,
    startTime: req.startTime,
    hours: req.hours,
    people: req.people,
    fullName: req.fullName,
    email: req.email,
    phone: req.phone,
  };
}

// Domain to API GuideBooking schema
export function toGuideBooking(
  booking: GuideBooking
): components["schemas"]["GuideBooking"] {
  return {
    bookingReference: booking.bookingReference,
    guide: toGuide(booking.guide),
    date: booking.date,
    people: booking.people,
    totalPaid: booking.totalPaid,
    ...(booking.paymentSummary
      ? { paymentSummary: booking.paymentSummary }
      : {}),
  };
}

// Domain to API Tour schema
export function toTour(tour: Tour): components["schemas"]["Tour"] {
  return {
    name: tour.name,
    description: tour.description,
    durationHours: tour.durationHours,
    maxPeople: tour.maxPeople,
    price: tour.price,
  };
}
