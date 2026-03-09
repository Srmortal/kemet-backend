import type { NextFunction, Request, Response } from "express";
import type { DomainError } from "#app/shared/types/domain-error.type.js";
import { ApiError } from "#app/shared/utils/core/ApiError.js";
import type { components } from "./dtos/generated.js";
import type { TourPackageService } from "./services/tourPackage.service.js";
import type { TourPackageBookingService } from "./services/tourPackageBooking.service.js";
import {
  fromCreateTourPackageBookingRequest,
  toCreateTourPackageBookingResponse,
  toTourPackageDetail,
  toTourPackageSummary,
} from "./tourPackage.mapper.js";

// Local type aliases for OpenAPI-generated types
type GetAllTourPackagesRequest = Request;
type GetAllTourPackagesResponse = Response<
  components["schemas"]["TourPackageSummary"][]
>;

type GetTourPackageByIdRequest = Request<{ id: string }>;
type GetTourPackageByIdResponse = Response<
  components["schemas"]["TourPackageDetails"]
>;

export class TourPackageController {
  private readonly tourPackageService: TourPackageService;
  private readonly tourPackageBookingService: TourPackageBookingService;

  constructor(
    tourPackageService: TourPackageService,
    tourPackageBookingService: TourPackageBookingService
  ) {
    this.tourPackageService = tourPackageService;
    this.tourPackageBookingService = tourPackageBookingService;
  }

  // GET /tour-packages
  getAllTourPackages = async (
    req: GetAllTourPackagesRequest,
    res: GetAllTourPackagesResponse,
    next: NextFunction
  ) => {
    const { category, page, limit } = req.query;
    const domainInput: { category?: string; page?: number; limit?: number } =
      {};
    if (typeof category === "string") {
      domainInput.category = category;
    }
    if (typeof page === "string" && page) {
      domainInput.page = Number(page);
    }
    if (typeof limit === "string" && limit) {
      domainInput.limit = Number(limit);
    }

    const result =
      await this.tourPackageService.getAllTourPackages(domainInput);
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

    const payload: components["schemas"]["TourPackageSummary"][] =
      result.value.map(toTourPackageSummary);
    return res.status(200).json(payload);
  };

  // GET /tour-packages/{id}
  getTourPackageById = async (
    req: GetTourPackageByIdRequest,
    res: GetTourPackageByIdResponse,
    next: NextFunction
  ) => {
    const { id } = req.params;
    const result = await this.tourPackageService.getTourPackageById(id);

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

    const payload: components["schemas"]["TourPackageDetails"] =
      toTourPackageDetail(result.value);
    return res.status(200).json(payload);
  };

  bookTourPackage = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    const bookingRequest = fromCreateTourPackageBookingRequest(
      req.body,
      req.params.id
    );
    const bookingResult =
      await this.tourPackageBookingService.bookTourPackage(bookingRequest);

    if (bookingResult.ok) {
      return res
        .status(201)
        .json(toCreateTourPackageBookingResponse(bookingResult.value));
    }

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
  };
}
