import type { NextFunction, Request, Response } from "express";
import type { DomainError } from "#app/shared/types/domain-error.type.js";
import { ApiError } from "#app/shared/utils/core/ApiError.js";
import type { components, paths } from "./dtos/generated.js";
import type { BookingService } from "./services/booking.service.js";
// Awilix-express controller factory
import type { TourismService } from "./services/tourism.service.js";
import {
  fromCreateTourismBookingRequest,
  toTourismBooking,
  toTourismBookings,
  toTourismCategory,
  toTourismLocation,
  toTourismPlace,
  toTourismPlacesRes,
} from "./tourism.mapper.js";

// Controller-local type aliases for OpenAPI types
type GetPlacesQuery = NonNullable<paths["/"]["get"]["parameters"]["query"]>;
type GetPlacesRes =
  paths["/"]["get"]["responses"]["200"]["content"]["application/json"];

type GetPlaceByIdParams = paths["/{id}"]["get"]["parameters"]["path"];
type GetPlaceByIdRes =
  paths["/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

type LocationsRes =
  paths["/locations"]["get"]["responses"]["200"]["content"]["application/json"];
type CategoriesRes =
  paths["/categories"]["get"]["responses"]["200"]["content"]["application/json"];
type StatsRes =
  paths["/stats"]["get"]["responses"]["200"]["content"]["application/json"];

type CreateTourismBookingRequest = Request<
  { id: string },
  unknown,
  components["schemas"]["CreateBookingRequest"]
>;
type CreateTourismBookingResponse = Response<
  paths["/{id}/book"]["post"]["responses"]["201"]["content"]["application/json"]
>;

type GetTourismBookingsRequest = Request;
type GetTourismBookingsResponse = Response<
  paths["/bookings"]["get"]["responses"]["200"]["content"]["application/json"]
>;

export const tourismController = (
  tourismService: TourismService,
  bookingService: BookingService
) => ({
  getAllTourismPlaces: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const query = req.query as Partial<GetPlacesQuery>;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const serviceParams = {
      sortBy: query.sortBy ?? "-date",
      page,
      limit,
      ...(typeof query.filter === "string" ? { location: query.filter } : {}),
      ...(typeof query.category === "string"
        ? { category: query.category }
        : {}),
    };
    const result = await tourismService.getPlaces(serviceParams);
    if (!result.ok) {
      const err = result.error as DomainError;
      let apiError: ApiError;
      switch (err.type) {
        case "NotFound":
          apiError = new ApiError(404, err.message);
          break;
        case "Conflict":
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || "Internal Server Error");
      }
      return next(apiError);
    }
    const value = result.value;
    // Use new mapper
    const payload: GetPlacesRes = toTourismPlacesRes(value);
    res.json(payload);
  },
  getTourismPlaceById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const params = req.params as GetPlaceByIdParams;
    const result = await tourismService.getPlaceById(params.id);
    if (!result.ok) {
      const err = result.error as DomainError;
      let apiError: ApiError;
      switch (err.type) {
        case "NotFound":
          apiError = new ApiError(404, err.message);
          break;
        case "Conflict":
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || "Internal Server Error");
      }
      return next(apiError);
    }
    const place = result.value;
    const payload: GetPlaceByIdRes = toTourismPlace(place);
    res.json(payload);
  },
  getTourismLocationsList: async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const result = await tourismService.getLocations();
    if (!result.ok) {
      const err = result.error as DomainError;
      let apiError: ApiError;
      switch (err.type) {
        case "NotFound":
          apiError = new ApiError(404, err.message);
          break;
        case "Conflict":
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || "Internal Server Error");
      }
      return next(apiError);
    }
    const value = result.value;
    // Use new mapper
    const payload: LocationsRes = Array.isArray(value.locations)
      ? value.locations.map(toTourismLocation)
      : [];
    res.json(payload);
  },
  getTourismCategoriesList: async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const result = await tourismService.getCategories();
    if (!result.ok) {
      const err = result.error as DomainError;
      let apiError: ApiError;
      switch (err.type) {
        case "NotFound":
          apiError = new ApiError(404, err.message);
          break;
        case "Conflict":
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || "Internal Server Error");
      }
      return next(apiError);
    }
    const value = result.value;
    // Use new mapper
    const payload: CategoriesRes = Array.isArray(value.categories)
      ? value.categories.map(toTourismCategory)
      : [];
    res.json(payload);
  },
  getTourismStatsOverview: async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const result = await tourismService.getStats();
    if (!result.ok) {
      const err = result.error as DomainError;
      let apiError: ApiError;
      switch (err.type) {
        case "NotFound":
          apiError = new ApiError(404, err.message);
          break;
        case "Conflict":
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || "Internal Server Error");
      }
      return next(apiError);
    }
    const value = result.value;
    const payload: StatsRes = {
      totalPlaces: value.totalPlaces ?? 0,
      totalCategories: value.categoryCount ?? 0,
    };
    res.json(payload);
  },
  createTourismBooking: async (
    req: CreateTourismBookingRequest,
    res: CreateTourismBookingResponse,
    next: NextFunction
  ) => {
    const bookingInput = {
      ...fromCreateTourismBookingRequest(req.body, req.params.id),
      userId: req.user?.id,
    };
    const bookingResult = await bookingService.createBooking(bookingInput);
    if (!bookingResult.ok) {
      const err = bookingResult.error as DomainError;
      let apiError: ApiError;
      switch (err.type) {
        case "NotFound":
          apiError = new ApiError(404, err.message);
          break;
        case "Conflict":
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || "Internal Server Error");
      }
      return next(apiError);
    }
    const booking = bookingResult.value;
    const payload = toTourismBooking(booking);
    res.status(201).json(payload);
  },
  getTourismBookingsForUser: async (
    req: GetTourismBookingsRequest,
    res: GetTourismBookingsResponse,
    next: NextFunction
  ) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(new ApiError(401, "User not authenticated"));
    }
    const result = await bookingService.getUserBookings(userId);
    if (!result.ok) {
      const err = result.error as DomainError;
      let apiError: ApiError;
      switch (err.type) {
        case "NotFound":
          apiError = new ApiError(404, err.message);
          break;
        case "Conflict":
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || "Internal Server Error");
      }
      return next(apiError);
    }
    const bookings = result.value;
    // Use new mapper
    const payload = toTourismBookings(bookings);
    res.json(payload);
  },
});
