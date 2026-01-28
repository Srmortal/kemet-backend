import { ApiError } from '@utils/ApiError';
import type { DomainError } from '../types/domain-error.type';
import { NextFunction, Request, Response } from 'express';
import { tourPackageService } from '../services/tourPackage.service';
import type { components } from '../types/api';
import { bookTourPackage } from '@services/tourPackageBooking.service';

// Local type aliases for OpenAPI-generated types
type GetAllTourPackagesRequest = Request;
type GetAllTourPackagesResponse = Response<
  components['schemas']['TourPackageSummary'][]
>;

type GetTourPackageByIdRequest = Request<{ id: string }>;
type GetTourPackageByIdResponse = Response<
  components['schemas']['TourPackageDetail']
>;

export class TourPackageController {
  // GET /tour-packages
  static async getAllTourPackages(req: GetAllTourPackagesRequest, res: GetAllTourPackagesResponse, next: NextFunction) {
    // Extract query params as defined in OpenAPI
    const { category, page, limit } = req.query;
    // Map API query params to domain input
    const domainInput = {
      category: category as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    const result = await tourPackageService.getAllTourPackages(domainInput);
    // Map domain result to OpenAPI response type
    if (!result.ok) {
      const err = result.error as DomainError;
      let apiError;
      switch (err.type) {
        case 'NotFound':
          apiError = new ApiError(404, err.message);
          break;
        case 'Conflict':
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || 'Internal Server Error');
      }
      return next(apiError);
    }
    const payload: components['schemas']['TourPackageSummary'][] = result.value;
    res.status(200).json(payload);
  }

  // GET /tour-packages/{id}
  static async getTourPackageById(req: GetTourPackageByIdRequest, res: GetTourPackageByIdResponse, next: NextFunction) {
    const { id } = req.params;
    const result = await tourPackageService.getTourPackageById(id);
    if (!result.ok) {
      const err = result.error as DomainError;
      let apiError;
      switch (err.type) {
        case 'NotFound':
          apiError = new ApiError(404, err.message);
          break;
        case 'Conflict':
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || 'Internal Server Error');
      }
      return next(apiError);
    }
    // Map domain result to OpenAPI response type
    const payload: components['schemas']['TourPackageDetail'] = result.value;
    res.status(200).json(payload);
  }

  static async bookTourPackageController(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Use all booking fields directly from request body
    const bookingRequest: components['schemas']['CreateTourPackageBookingRequest'] = req.body;

    // Pass tourId as tourPackageId to service
    const bookingInput = {
      tourPackageId: bookingRequest.tourId,
      tourDate: bookingRequest.tourDate,
      numberOfPeople: bookingRequest.numberOfPeople,
      fullName: bookingRequest.fullName,
      email: bookingRequest.email,
      phoneNumber: bookingRequest.phoneNumber,
      hotelName: bookingRequest.hotelName,
      specialRequests: bookingRequest.specialRequests,
    };

    const bookingResult = await bookTourPackage(bookingInput);

    if (bookingResult.ok) {
      res.status(201).json(bookingResult.value);
    } else {
      const err = bookingResult.error as DomainError;
      let apiError;
      switch (err.type) {
        case 'NotFound':
          apiError = new ApiError(404, err.message);
          break;
        case 'Conflict':
          apiError = new ApiError(409, err.message);
          break;
        default:
          apiError = new ApiError(500, err.message || 'Internal Server Error');
      }
      next(apiError);
    }
  }
}
