/**
 * Data Transfer Objects for Monuments API
 * Controls what data is exposed to clients
 */

export interface MonumentListItemDto {
  id: string;
  url: string;
  title: string;
  description: string;
  image?: string;
  categories: string[];
  tags: string[];
  publishDate?: string;
}

export interface MonumentDetailDto {
  id: string;
  url: string;
  title: string;
  h1?: string;
  description: string;
  keywords?: string;
  author?: string;
  publishDate?: string;
  image?: string;
  text: string;
  headings: { level: number; text: string }[];
  lists: string[];
  tables: string[];
  categories: string[];
  tags: string[];
  relatedLinks: string[];
}

export interface MonumentSearchDto {
  id: string;
  url: string;
  title: string;
  description: string;
  image?: string;
  categories: string[];
  excerpt: string; // First 200 chars of text
}

export interface CategoryDto {
  name: string;
  count: number;
}

export interface TagDto {
  name: string;
  count: number;
}

export interface StatsDto {
  totalPages: number;
  totalCategories: number;
  totalTags: number;
  lastUpdated?: string;
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}
