import type { components } from "./dtos/generated.js";
import type {
  CreateTourPackageBookingRequest,
  CreateTourPackageBookingResponse,
  TourPackageDetail,
  TourPackageSummary,
} from "./port/tourPackage.types.js";

// Domain to API TourPackageSummary schema
export function toTourPackageSummary(
  pkg: TourPackageSummary
): components["schemas"]["TourPackageSummary"] {
  return {
    id: pkg.id,
    name: pkg.name,
    image: pkg.image,
    pricePerPerson: pkg.pricePerPerson,
    discount: pkg.discount ?? 0, // Always a number
    rating: pkg.rating,
    location: pkg.location,
  };
}

// Domain to API TourPackageDetails schema
export function toTourPackageDetail(
  pkg: TourPackageDetail
): components["schemas"]["TourPackageDetails"] {
  const result: components["schemas"]["TourPackageDetails"] = {
    id: pkg.id,
    name: pkg.name,
    image: pkg.image,
    pricePerPerson: pkg.pricePerPerson,
    rating: pkg.rating,
    location: pkg.location,
    availableLanguages: pkg.availableLanguages,
    included: pkg.included,
    itinerary: pkg.itinerary,
    duration: pkg.duration,
    discount: pkg.discount ?? 0, // Always a number
    groupSize: pkg.groupSize,
  };
  if (pkg.discount !== undefined) {
    result.discount = pkg.discount;
  }
  return result;
}

// API request to domain for CreateTourPackageBookingRequest
export function fromCreateTourPackageBookingRequest(
  req: components["schemas"]["CreateTourPackageBookingRequest"],
  tourId: string
): CreateTourPackageBookingRequest {
  const result: CreateTourPackageBookingRequest = {
    tourId,
    tourDate: req.tourDate,
    numberOfPeople: req.numberOfPeople,
    fullName: req.fullName,
    email: req.email,
    phoneNumber: req.phoneNumber,
  };
  if (req.hotelName !== undefined) {
    result.hotelName = req.hotelName;
  }
  if (req.specialRequests !== undefined) {
    result.specialRequests = req.specialRequests;
  }
  return result;
}

// Domain to API CreateTourPackageBookingResponse schema
export function toCreateTourPackageBookingResponse(
  resp: CreateTourPackageBookingResponse
): components["schemas"]["CreateTourPackageBookingResponse"] {
  return {
    bookingId: resp.bookingId,
    bookingReference: resp.bookingReference,
    status: resp.status,
    message: resp.message,
    tourId: resp.tourId,
    tourName: resp.tourName,
    tourDate: resp.tourDate,
    pickupTime: resp.pickupTime,
    durationHours: resp.durationHours,
    difficulty: resp.difficulty,
    city: resp.city,
    included: resp.included,
    numberOfPeople: resp.numberOfPeople,
    guestName: resp.guestName,
    guestEmail: resp.guestEmail,
    guestPhone: resp.guestPhone,
    totalAmount: resp.totalAmount,
    discount: resp.discount,
    currentPrice: resp.currentPrice,
    discountPercentage: resp.discountPercentage,
  };
}
