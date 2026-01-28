export interface PaginationMeta {
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  total?: number;
  totalPages?: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}
