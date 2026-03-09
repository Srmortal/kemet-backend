// Domain model for getPlaces params
export interface GetPlacesParams {
  category?: string;
  limit?: number;
  location?: string;
  page?: number;
  sortBy?: string;
}

// Domain model for paginated places result
export interface PlacesResult {
  data: TourismPlace[];
  filters: {
    location: string | null;
    category: string | null;
    sortBy?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Domain model for locations result
export interface LocationsResult {
  count: number;
  locations: string[];
}

// Domain model for categories result
export interface CategoriesResult {
  categories: string[];
  count: number;
}

// Domain model for stats result
export interface StatsResult {
  avgRating: number | string;
  categories: string[];
  categoryCount: number;
  locationCount: number;
  locations: string[];
  priceRange: { min: number; max: number };
  totalPlaces: number;
}
// Domain model for TourismPlace
export interface TourismPlace {
  address: string;
  category: string;
  coordinates: { latitude: number; longitude: number };
  description: string;
  features: string[];
  hours: { open: string; close: string };
  id: string;
  image: string;
  isOpen: boolean;
  location: string;
  phoneNumber?: string;
  price: number;
  rating: number;
  reviewsCount: number;
  title: string;
}

// Domain model for CreateTourismBookingRequest
export interface CreateTourismBookingRequest {
  date: string;
  guests: number;
  siteId: string;
  specialRequests?: string;
  time: string;
}

// Domain model for TourismBooking
export interface TourismBooking {
  bookingId: string;
  date: string;
  guests: number;
  siteId: string;
  specialRequests?: string;
  time: string;
}

// Domain model for mapped location
export interface TourismLocation {
  location: string;
}

// Domain model for mapped category
export interface TourismCategory {
  category: string;
}
