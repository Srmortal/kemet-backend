import { HybridCache } from "#app/shared/utils/core/hybridCache.js";
import type { DomainError } from "../../../shared/types/domain-error.type.js";
import type { Result } from "../../../shared/types/result.types.js";
import { err, ok } from "../../../shared/types/result.types.js";
import type {
  CategoriesResult,
  GetPlacesParams,
  LocationsResult,
  PlacesResult,
  StatsResult,
  TourismPlace,
} from "../port/tourism.types.js";
import type { TourismRepository } from "../port/tourism-repository.js";

const PAGE_SIZE = 20;
const CACHE_TTL = 2 * 60 * 1000;
const cache = new HybridCache(20, 5, CACHE_TTL);

export class TourismService {
  private readonly tourismRepository: TourismRepository;

  constructor(tourismRepository: TourismRepository) {
    this.tourismRepository = tourismRepository;
  }

  // Getter for backwards compatibility
  private get repo() {
    return this.tourismRepository;
  }

  private async getCache<T>(key: string): Promise<T | null> {
    return (await cache.get<T>(key)) || null;
  }

  private async setCache(key: string, data: unknown): Promise<void> {
    await cache.set(key, data);
  }

  private normalizePagination(page?: number, limit?: number) {
    const pageNum = Math.max(1, page || 1);
    const pageSize = Math.min(100, Math.max(1, limit || PAGE_SIZE));
    return { pageNum, pageSize };
  }

  async getPlaces(params: GetPlacesParams): Promise<Result<PlacesResult>> {
    const cacheKey = `places:${JSON.stringify(params)}`;
    const cached = await this.getCache<PlacesResult>(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const { location, category, sortBy = "-date", page, limit } = params;
    const { pageNum, pageSize } = this.normalizePagination(page, limit);

    const filterParams: {
      location?: string;
      category?: string;
      sortBy?: string;
      pageNum: number;
      pageSize: number;
    } = {
      pageNum,
      pageSize,
    };
    if (location !== undefined) {
      filterParams.location = location;
    }
    if (category !== undefined) {
      filterParams.category = category;
    }
    if (sortBy !== undefined) {
      filterParams.sortBy = sortBy;
    }

    const { places, totalCount } =
      await this.repo.getPlacesWithFilters(filterParams);

    const totalPages = Math.ceil(totalCount / pageSize);

    const result: PlacesResult = {
      data: places,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      filters: {
        location: location || null,
        category: category || null,
        sortBy,
      },
    };
    this.setCache(cacheKey, result);
    return ok(result);
  }

  async getPlaceById(id: string): Promise<Result<TourismPlace, DomainError>> {
    const cacheKey = `place:${id}`;
    const cached = await this.getCache<TourismPlace>(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const place = await this.repo.getById(id);
    if (!place) {
      return err({ type: "NotFound", message: "Tourism place not found" });
    }

    const enriched = this.repo.enrichPlaceData(place);
    await this.setCache(cacheKey, enriched);
    return ok(enriched);
  }

  async getLocations(): Promise<Result<LocationsResult>> {
    const cacheKey = "locations";
    const cached = await this.getCache<LocationsResult>(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const allPlaces = await this.repo.getAll();
    const locations = new Set<string>();
    for (const place of allPlaces) {
      if (typeof place.location === "string") {
        locations.add(place.location);
      }
    }

    const result: LocationsResult = {
      locations: Array.from(locations).sort(),
      count: locations.size,
    };
    await this.setCache(cacheKey, result);
    return ok(result);
  }

  async getCategories(): Promise<Result<CategoriesResult>> {
    const cacheKey = "categories";
    const cached = await this.getCache<CategoriesResult>(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const allPlaces = await this.repo.getAll();
    const categories = new Set<string>();
    for (const place of allPlaces) {
      if (place.category) {
        categories.add(place.category);
      }
    }
    const result: CategoriesResult = {
      categories: Array.from(categories).sort(),
      count: categories.size,
    };
    await this.setCache(cacheKey, result);
    return ok(result);
  }

  async getStats(): Promise<Result<StatsResult>> {
    const cacheKey = "stats";
    const cached = await this.getCache<StatsResult>(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const allPlaces = await this.repo.getAll();
    const stats = {
      totalPlaces: allPlaces.length,
      locations: new Set<string>(),
      categories: new Set<string>(),
      avgRating: 0,
      priceRange: { min: Number.POSITIVE_INFINITY, max: 0 },
    };
    let totalRating = 0;
    let ratingCount = 0;

    for (const place of allPlaces) {
      if (typeof place.location === "string") {
        stats.locations.add(place.location);
      }

      if (place.category) {
        stats.categories.add(place.category);
      }
      if (typeof place.rating === "number") {
        totalRating += place.rating;
        ratingCount += 1;
      }
      if (typeof place.price === "number") {
        stats.priceRange.min = Math.min(stats.priceRange.min, place.price);
        stats.priceRange.max = Math.max(stats.priceRange.max, place.price);
      }
    }

    const result: StatsResult = {
      totalPlaces: stats.totalPlaces,
      locations: Array.from(stats.locations),
      locationCount: stats.locations.size,
      categories: Array.from(stats.categories),
      categoryCount: stats.categories.size,
      avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0,
      priceRange: {
        min:
          stats.priceRange.min === Number.POSITIVE_INFINITY
            ? 0
            : stats.priceRange.min,
        max: stats.priceRange.max,
      },
    };
    await this.setCache(cacheKey, result);
    return ok(result);
  }
}
