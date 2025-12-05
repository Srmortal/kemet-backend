import { firebaseAdmin } from '../config/firebase';
import { ApiError } from '../utils/ApiError';
import type {
  MonumentListItemDto,
  MonumentDetailDto,
  MonumentSearchDto,
  CategoryDto,
  TagDto,
  StatsDto,
  PaginationDto,
} from '../types/monuments.dto';

// Internal type - not exposed to clients
type MonumentInternal = {
  id: string;
  url: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  excerpt: string;
  image?: string;
  imageStoragePath?: string;
  metadata: {
    author?: string;
    publishDate?: string;
    keywords: string[];
    h1?: string;
  };
  structure: {
    headings: { level: number; text: string; id: string }[];
    hasTables: boolean;
    hasLists: boolean;
  };
  categories: string[];
  tags: string[];
  relatedPages: string[];
  searchText: string;
  status: 'published' | 'draft';
  importedAt: FirebaseFirestore.Timestamp;
  lastUpdated: FirebaseFirestore.Timestamp;
};

type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationDto;
};

/**
 * Service for Egyptian monuments data
 */
export class MonumentsService {
  private collection = firebaseAdmin.firestore().collection('monuments_clean');

  /**
   * Transform internal monument to list item DTO
   */
  private toListItemDto(doc: MonumentInternal): MonumentListItemDto {
    return {
      id: doc.id,
      url: doc.url,
      title: doc.title,
      description: doc.description,
      image: doc.image,
      categories: doc.categories,
      tags: doc.tags,
      publishDate: doc.metadata.publishDate,
    };
  }

  /**
   * Transform internal monument to detail DTO
   */
  private toDetailDto(doc: MonumentInternal): MonumentDetailDto {
    return {
      id: doc.id,
      url: doc.url,
      title: doc.title,
      h1: doc.metadata.h1,
      description: doc.description,
      keywords: doc.metadata.keywords.join(', '),
      author: doc.metadata.author,
      publishDate: doc.metadata.publishDate,
      image: doc.image,
      text: doc.content,
      headings: doc.structure.headings,
      lists: [],
      tables: [],
      categories: doc.categories,
      tags: doc.tags,
      relatedLinks: doc.relatedPages,
    };
  }

  /**
   * Transform internal monument to search DTO
   */
  private toSearchDto(doc: MonumentInternal): MonumentSearchDto {
    return {
      id: doc.id,
      url: doc.url,
      title: doc.title,
      description: doc.description,
      image: doc.image,
      categories: doc.categories,
      excerpt: doc.excerpt,
    };
  }

  /**
   * Get all monuments with pagination and filtering
   */
  async getAll(options: {
    limit?: number;
    page?: number;
    category?: string;
    tag?: string;
    search?: string;
  }): Promise<PaginatedResult<MonumentListItemDto>> {
    const limit = Math.min(options.limit || 20, 100); // Max 100 per page
    const page = Math.max(options.page || 1, 1);
    const offset = (page - 1) * limit;

    let query: FirebaseFirestore.Query = this.collection;

    // Apply filters
    if (options.category) {
      query = query.where('categories', 'array-contains', options.category);
    }
    if (options.tag) {
      query = query.where('tags', 'array-contains', options.tag);
    }

    // Order by lastUpdated descending
    query = query.orderBy('lastUpdated', 'desc');

    // Get total count for pagination
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Apply pagination
    query = query.offset(offset).limit(limit);

    const snapshot = await query.get();
    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as MonumentInternal));

    // Filter by search if provided
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(item =>
        item.searchText.includes(searchLower)
      );
    }

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map(item => this.toListItemDto(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Get monument by ID
   */
  async getById(id: string): Promise<MonumentDetailDto> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new ApiError(404, 'Monument not found');
    }

    const data = {
      id: doc.id,
      ...doc.data(),
    } as MonumentInternal;

    return this.toDetailDto(data);
  }

  /**
   * Get monument by original URL
   */
  async getByUrl(url: string): Promise<MonumentDetailDto> {
    const id = Buffer.from(url).toString('base64url');
    return this.getById(id);
  }

  /**
   * Get all unique categories with counts
   */
  async getCategories(): Promise<CategoryDto[]> {
    const snapshot = await this.collection.select('categories').get();
    const categoriesMap = new Map<string, number>();

    snapshot.docs.forEach(doc => {
      const categories = doc.data().categories as string[] | undefined;
      if (categories) {
        categories.forEach(cat => {
          categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + 1);
        });
      }
    });

    return Array.from(categoriesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get all unique tags with counts
   */
  async getTags(): Promise<TagDto[]> {
    const snapshot = await this.collection.select('tags').get();
    const tagsMap = new Map<string, number>();

    snapshot.docs.forEach(doc => {
      const tags = doc.data().tags as string[] | undefined;
      if (tags) {
        tags.forEach(tag => {
          tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Search monuments by text
   */
  async search(searchQuery: string, options: { limit?: number; page?: number }): Promise<PaginatedResult<MonumentSearchDto>> {
    const result = await this.getAll({ ...options, search: searchQuery });
    
    // Transform to search DTOs
    const snapshot = await this.collection
      .orderBy('lastUpdated', 'desc')
      .limit(result.pagination.limit)
      .get();
    
    const searchResults = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as MonumentInternal))
      .filter(item => item.searchText.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(item => this.toSearchDto(item));

    return {
      items: searchResults,
      pagination: result.pagination,
    };
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<StatsDto> {
    const [countSnapshot, categories, tags] = await Promise.all([
      this.collection.count().get(),
      this.getCategories(),
      this.getTags(),
    ]);

    // Get latest update date
    const latestDoc = await this.collection
      .orderBy('lastUpdated', 'desc')
      .limit(1)
      .get();
    
    const lastUpdated = latestDoc.docs[0]?.data()?.lastUpdated?.toDate()?.toISOString();

    return {
      totalPages: countSnapshot.data().count,
      totalCategories: categories.length,
      totalTags: tags.length,
      lastUpdated,
    };
  }
}
