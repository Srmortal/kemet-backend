import { ApiError } from '@utils/ApiError';
import type { DomainError } from '../types/domain-error.type';
import { NextFunction, Request, Response } from 'express';
import { tourismService } from '@services/tourism.service';
import type { paths } from '../types/api';

// Controller-local type aliases for OpenAPI types
type GetPlacesQuery = NonNullable<paths["/tourism"]["get"]["parameters"]["query"]>;
type GetPlacesRes = paths["/tourism"]["get"]["responses"]["200"]["content"]["application/json"];

type GetPlaceByIdParams = paths["/tourism/{id}"]["get"]["parameters"]["path"];
type GetPlaceByIdRes = paths["/tourism/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

type LocationsRes = paths["/tourism/locations/list"]["get"]["responses"]["200"]["content"]["application/json"];
type CategoriesRes = paths["/tourism/categories/list"]["get"]["responses"]["200"]["content"]["application/json"];
type StatsRes = paths["/tourism/stats/overview"]["get"]["responses"]["200"]["content"]["application/json"];

export async function getTourismPlaces(req: Request, res: Response, next: NextFunction): Promise<void> {
  const query = req.query as Partial<GetPlacesQuery>;
  const page = query.page;
  const limit = query.limit;
  const serviceParams = {
    location: query.filter,
    category: query.category,
    sortBy: query.sortBy ?? '-date',
    page,
    limit,
  };
  const result = await tourismService.getPlaces(serviceParams);
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

  // Map service result to OpenAPI type if needed
  const value = result.value;
  const payload: GetPlacesRes = {
    items: value.data?.map((place: { id?: string; name?: string; title?: string; [key: string]: unknown }) => ({
      ...place,
      id: place.id ?? '',
      name: place.name ?? place.title ?? '', // Map 'title' to 'name' if needed
    })),
    total: value.pagination?.total ?? 0,
    page: value.pagination?.page ?? 1,
    limit: value.pagination?.limit ?? 10,
    filters: value.filters ?? {},
  };
  res.json(payload);
}

export async function getTourismPlaceById(req: Request, res: Response, next: NextFunction): Promise<void> {
  const params = req.params as GetPlaceByIdParams;
  const result = await tourismService.getPlaceById(params.id);
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

  const place = result.value;
  const payload: GetPlaceByIdRes = {
    id: place.id!,
    title: place.title!,
    // add any other required fields from your OpenAPI schema here
  };
  res.json(payload);
}

export async function getTourismLocations(_req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = await tourismService.getLocations();
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

  // Map service result to OpenAPI type if needed
  const value = result.value;
  const payload: LocationsRes = Array.isArray(value.locations)
    ? value.locations.map((location: string) => ({ location }))
    : [];
  res.json(payload);
}

export async function getTourismCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = await tourismService.getCategories();
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

  // Map service result to OpenAPI type if needed
  const value = result.value;
  const payload: CategoriesRes = Array.isArray(value.categories)
    ? value.categories.map((category: string) => ({ category }))
    : [];
  res.json(payload);
}

export async function getTourismStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = await tourismService.getStats();
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

  // Map service result to OpenAPI type if needed
  const value = result.value;
  const payload: StatsRes = {
    totalPlaces: value.totalPlaces ?? 0,
    totalCategories: value.categoryCount ?? 0,
  };
  res.json(payload);
}
