import { firebaseAdmin } from '../config/firebase';

const COLLECTION = 'tourism_places_unified';
const PAGE_SIZE = 20;

type SortBy = 'rating' | '-rating' | 'price' | '-price' | 'duration' | '-duration';

type GetActivitiesParams = {
  location?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: SortBy | string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type Activity = Record<string, unknown>;

type ActivitiesResult = {
  data: Activity[];
  pagination: Pagination;
  filters: {
    location: string | null;
    category: string | null;
    sortBy?: string;
  };
};

type SearchResult = {
  data: Activity[];
  pagination: Pagination;
  query: string;
};

type LocationsResult = { locations: string[]; count: number };

type CategoriesResult = { categories: string[]; count: number };

type StatsResult = {
  totalActivities: number;
  locations: string[];
  locationCount: number;
  categories: string[];
  categoryCount: number;
  avgRating: number | string;
  priceRange: { min: number; max: number };
};

class TourismService {
  private collection = firebaseAdmin.firestore().collection(COLLECTION);

  private normalizePagination(page?: number, limit?: number) {
    const pageNum = Math.max(1, page || 1);
    const pageSize = Math.min(100, Math.max(1, limit || PAGE_SIZE));
    return { pageNum, pageSize };
  }

  private buildSort(query: FirebaseFirestore.Query, sortBy?: SortBy | string) {
    const sortMap: Record<string, string> = {
      rating: 'rating',
      '-rating': 'rating',
      price: 'price',
      '-price': 'price',
      duration: 'duration',
      '-duration': 'duration',
    };

    const sortField = sortMap[String(sortBy)] || 'rating';
    const isDescending = String(sortBy).startsWith('-');
    return isDescending ? query.orderBy(sortField, 'desc') : query.orderBy(sortField, 'asc');
  }

  async getActivities(params: GetActivitiesParams): Promise<ActivitiesResult> {
    const { location, category, sortBy = 'rating', page, limit } = params;
    const { pageNum, pageSize } = this.normalizePagination(page, limit);

    let query: FirebaseFirestore.Query = this.collection;
    if (location) query = query.where('location', '==', String(location));
    if (category) query = query.where('category', '==', String(category));
    query = this.buildSort(query, sortBy);

    const countSnapshot = await query.count().get();
    const totalCount = countSnapshot.data().count;

    const skip = (pageNum - 1) * pageSize;
    const snapshot = await query.offset(skip).limit(pageSize).get();
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: activities,
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
  }

  async getActivityById(id: string): Promise<Activity | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async searchActivities(queryText: string, page?: number, limit?: number): Promise<SearchResult> {
    const query = String(queryText || '').toLowerCase();
    if (!query) throw new Error('Search query required');

    const { pageNum, pageSize } = this.normalizePagination(page, limit);

    const snapshot = await this.collection.get();
    const filtered = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const searchFields = [
          data.title?.toLowerCase() || '',
          data.description?.toLowerCase() || '',
          data.category?.toLowerCase() || '',
          data.location?.toLowerCase() || '',
        ].join(' ');
        return searchFields.includes(query);
      })
      .map(doc => ({ id: doc.id, ...doc.data() }));

    const skip = (pageNum - 1) * pageSize;
    const results = filtered.slice(skip, skip + pageSize);
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: results,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      query,
    };
  }

  async getLocations(): Promise<LocationsResult> {
    const snapshot = await this.collection.get();
    const locations = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.location) locations.add(data.location);
    });
    return { locations: Array.from(locations).sort(), count: locations.size };
  }

  async getCategories(): Promise<CategoriesResult> {
    const snapshot = await this.collection.get();
    const categories = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) categories.add(data.category);
    });
    return { categories: Array.from(categories).sort(), count: categories.size };
  }

  async getStats(): Promise<StatsResult> {
    const snapshot = await this.collection.get();
    const stats = {
      totalActivities: snapshot.size,
      locations: new Set<string>(),
      categories: new Set<string>(),
      avgRating: 0,
      priceRange: { min: Infinity, max: 0 },
    };
    let totalRating = 0;
    let ratingCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.location) stats.locations.add(data.location);
      if (data.category) stats.categories.add(data.category);
      if (data.rating) {
        totalRating += data.rating;
        ratingCount += 1;
      }
      if (data.price) {
        stats.priceRange.min = Math.min(stats.priceRange.min, data.price);
        stats.priceRange.max = Math.max(stats.priceRange.max, data.price);
      }
    });

    return {
      totalActivities: stats.totalActivities,
      locations: Array.from(stats.locations),
      locationCount: stats.locations.size,
      categories: Array.from(stats.categories),
      categoryCount: stats.categories.size,
      avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0,
      priceRange: {
        min: stats.priceRange.min === Infinity ? 0 : stats.priceRange.min,
        max: stats.priceRange.max,
      },
    };
  }
}

export const tourismService = new TourismService();
