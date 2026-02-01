// src/controllers/guide.controller.ts

import { NextFunction, Request, Response } from 'express';
// Types generated from OpenAPI
import { paths } from '../types/api'; // Adjust import path as needed

// Service stubs (to be implemented in STEP 4)
import * as guideService from '../services/guide.service';
import { DomainError } from '../types/domain-error.type';
import { ApiError } from '@utils/ApiError';

type BookGuideRequest = Request<unknown, unknown, paths["/guides/book"]["post"]["requestBody"]["content"]["application/json"]>;
type BookGuideResponse = Response<
  paths["/guides/book"]["post"]["responses"][201]["content"]["application/json"]
>;

// POST /guides/book
export async function bookGuide(req: BookGuideRequest, res: BookGuideResponse, next: NextFunction) {
  const result = await guideService.bookGuide(req.body);

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
      case 'ValidationError':
        apiError = new ApiError(400, err.message);
        break;
      default:
        apiError = new ApiError(500, err.message || 'Internal Server Error');
    }
    return next(apiError);
  }

  return res.status(201).json(result.value);
}

type GetGuidesRequest = Request<unknown,unknown,unknown, paths["/guides"]["get"]["parameters"]["query"]>;
type GetGuidesResponse = Response<
  paths["/guides"]["get"]["responses"]["200"]["content"]["application/json"]
>;

type GetGuideByIdRequest = Request<paths["/guides/{id}"]["get"]["parameters"]["path"]>;
type GetGuideByIdResponse = Response<
  paths["/guides/{id}"]["get"]["responses"]["200"]["content"]["application/json"]
>;

// GET /guides
export async function getGuides(req: GetGuidesRequest, res: GetGuidesResponse, next: NextFunction) {
  const page = req.query?.page ?? 1;
  const limit = req.query?.limit ?? 10;

  const result = await guideService.getGuides({ page, limit });

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

  const { guides, total, totalPages } = result.value;
  // Map to DTO: only include fields defined in OpenAPI spec
  const guidesDto = guides.map((g) => ({
    id: g.id,
    name: g.name,
    featured: g.featured,
    rating: g.rating,
    reviews: g.reviews,
    toursCount: g.toursCount,
    pricePerDay: g.pricePerDay,
    pricePerHour: g.pricePerHour,
    credentials: g.credentials,
    languages: g.languages,
    specializations: g.specializations,
    about: g.about,
    tours: g.tours?.map((t) => ({
      name: t.name,
      description: t.description,
      durationHours: t.durationHours,
      maxPeople: t.maxPeople,
      price: t.price,
    })) || [],
  }));
  const response = {
    guides: guidesDto,
    page,
    limit,
    total,
    totalPages,
  };
  return res.json(response);
}

// GET /guides/:id
export async function getGuideById(req: GetGuideByIdRequest, res: GetGuideByIdResponse, next: NextFunction) {
  const { id } = req.params;
  const result = await guideService.getGuideById(id);

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

  return res.json(result.value);
}