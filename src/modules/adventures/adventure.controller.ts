import type { NextFunction, Request, Response } from "express";
import type { DomainError } from "#app/shared/types/domain-error.type.js";
import { ApiError } from "#app/shared/utils/core/ApiError.js";
// Import mapper functions
import { toAdventureBooking, toAdventureListItem } from "./adventure.mapper.js";
import type { components } from "./dtos/generated.js";
import type { AdventureBookingService } from "./services/adventure.booking.service.js";
import type { AdventureService } from "./services/adventure.service.js";

type GetAdventuresRequest = Request;
type GetAdventuresResponse = Response<
  components["schemas"]["AdventureListItem"][]
>;
type GetAdventureByIdRequest = Request<{ id: string }>;
type GetAdventureByIdResponse = Response<
  components["schemas"]["AdventureListItem"]
>;
type BookAdventureRequest = Request<
  { id: string },
  unknown,
  components["schemas"]["CreateBookingRequest"]
>;
type BookAdventureResponse = Response<
  components["schemas"]["AdventureBooking"]
>;
type GetUserAdventureBookingsRequest = Request;
type GetUserAdventureBookingsResponse = Response<{
  bookings: components["schemas"]["AdventureBooking"][];
}>;

export const adventureController = (
  adventureService: AdventureService,
  adventureBookingService: AdventureBookingService
) => ({
  listAdventures: async (
    _req: GetAdventuresRequest,
    res: GetAdventuresResponse,
    next: NextFunction
  ) => {
    const result = await adventureService.getAdventures();
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
    // Use mapper
    const payload: components["schemas"]["AdventureListItem"][] =
      result.value.map(toAdventureListItem);
    res.json(payload);
  },
  getAdventureById: async (
    req: GetAdventureByIdRequest,
    res: GetAdventureByIdResponse,
    next: NextFunction
  ) => {
    const result = await adventureService.getAdventureById(req.params.id);
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
    // Use mapper
    const payload: components["schemas"]["AdventureListItem"] =
      toAdventureListItem(result.value);
    res.json(payload);
  },
  bookAdventure: async (
    req: BookAdventureRequest,
    res: BookAdventureResponse,
    next: NextFunction
  ) => {
    const userId = req.user?.id;
    const { date, time, guests, specialRequests } = req.body;
    const bookingData = {
      adventureId: req.params.id,
      date,
      time,
      guests,
      ...(specialRequests !== undefined && { specialRequests }),
      userId,
    };
    const result = await adventureBookingService.createBooking(bookingData);
    if (result.ok) {
      // Use mapper
      const payload: components["schemas"]["AdventureBooking"] =
        toAdventureBooking(result.value);
      return res.status(201).json(payload);
    }
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
  },
  getUserAdventureBookings: async (
    req: GetUserAdventureBookingsRequest,
    res: GetUserAdventureBookingsResponse,
    next: NextFunction
  ) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(new ApiError(401, "User not authenticated"));
    }
    const result = await adventureBookingService.getBookingsForUser(userId);
    if (result.ok) {
      // Use mapper
      const payload: { bookings: components["schemas"]["AdventureBooking"][] } =
        {
          bookings: result.value.map(toAdventureBooking),
        };
      return res.status(200).json(payload);
    }
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
  },
});
