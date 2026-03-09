import type {
  CreateBookingRepository,
  GetAllBookingsRepository,
  GetAllRepository,
  GetByIdMethodRepository,
} from "#app/shared/ports/generic-repository.js";
import type {
  CreateTourismBookingRequest,
  GetPlacesParams,
  TourismBooking,
  TourismPlace,
} from "./tourism.types.js";

export interface TourismRepository
  extends CreateBookingRepository<CreateTourismBookingRequest, TourismBooking>,
    GetAllRepository<TourismPlace>,
    GetAllBookingsRepository<TourismBooking>,
    GetByIdMethodRepository<"getById", TourismPlace, string, null> {
  enrichPlaceData(place: TourismPlace): TourismPlace;
  getPlacesWithFilters(
    params: GetPlacesParams & { pageNum: number; pageSize: number }
  ): Promise<{ places: TourismPlace[]; totalCount: number }>;
  queryBuilder(): unknown;
  // getUserById removed or should use a domain model if needed
}
