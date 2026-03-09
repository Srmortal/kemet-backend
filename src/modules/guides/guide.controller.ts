import type { NextFunction, Request, Response } from "express";
import type { DomainError } from "#app/shared/types/domain-error.type.js";
import { ApiError } from "#app/shared/utils/core/ApiError.js";
import type { paths } from "./dtos/generated.js";
import {
  fromCreateGuideBookingRequest,
  toGuide,
  toGuideBooking,
} from "./guide.mapper.js";
import type { GuideService } from "./guide.service.js";

type BookGuideRequest = Request<
  { id: string },
  unknown,
  paths["/{id}/book"]["post"]["requestBody"]["content"]["application/json"]
>;
type BookGuideResponse = Response<
  paths["/{id}/book"]["post"]["responses"][201]["content"]["application/json"]
>;

// POST /guides/book
export const guideController = (guideService: GuideService) => ({
  bookGuide: async (
    req: BookGuideRequest,
    res: BookGuideResponse,
    next: NextFunction
  ) => {
    const bookingRequest = fromCreateGuideBookingRequest(
      req.body,
      req.params.id
    );
    const result = await guideService.bookGuide(bookingRequest);
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
        case "ValidationError":
          apiError = new ApiError(400, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || "Internal Server Error");
      }
      return next(apiError);
    }
    return res.status(201).json(toGuideBooking(result.value));
  },
  listGuides: async (
    req: GetGuidesRequest,
    res: GetGuidesResponse,
    next: NextFunction
  ) => {
    const page = req.query?.page ?? 1;
    const limit = req.query?.limit ?? 10;
    const result = await guideService.getGuides({ page, limit });
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
    const { guides, total, totalPages } = result.value;
    const guidesDto = guides.map(toGuide);
    const response = {
      guides: guidesDto,
      page,
      limit,
      total,
      totalPages,
    };
    return res.json(response);
  },
  getGuideById: async (
    req: GetGuideByIdRequest,
    res: GetGuideByIdResponse,
    next: NextFunction
  ) => {
    const { id } = req.params;
    const result = await guideService.getGuideById(id);
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
    return res.json(toGuide(result.value));
  },
});

type GetGuidesRequest = Request<
  unknown,
  unknown,
  unknown,
  paths["/"]["get"]["parameters"]["query"]
>;
type GetGuidesResponse = Response<
  paths["/"]["get"]["responses"]["200"]["content"]["application/json"]
>;

type GetGuideByIdRequest = Request<paths["/{id}"]["get"]["parameters"]["path"]>;
type GetGuideByIdResponse = Response<
  paths["/{id}"]["get"]["responses"]["200"]["content"]["application/json"]
>;
