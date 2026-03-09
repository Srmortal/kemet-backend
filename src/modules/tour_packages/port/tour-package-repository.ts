import type {
  CreateBookingRepository,
  FindByIdRepository,
  GetAllBookingsRepository,
  GetAllWithOptionsRepository,
  GetByIdMethodRepository,
} from "#app/shared/ports/generic-repository.js";
import type {
  CreateTourPackageBookingRequest,
  CreateTourPackageBookingResponse,
  TourPackageDetail,
  TourPackageSummary,
} from "./tourPackage.types.js";

interface TourPackageListOptions {
  category?: string;
  limit?: number;
  page?: number;
}

export interface TourPackageRepository
  extends CreateBookingRepository<
      CreateTourPackageBookingRequest,
      CreateTourPackageBookingResponse
    >,
    FindByIdRepository<CreateTourPackageBookingResponse, string, null>,
    GetAllWithOptionsRepository<TourPackageSummary, TourPackageListOptions>,
    GetAllBookingsRepository<CreateTourPackageBookingResponse>,
    GetByIdMethodRepository<"getById", TourPackageDetail, string, undefined> {}
