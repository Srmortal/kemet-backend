export interface PaginationMeta {
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  page: number;
  total?: number;
  totalPages?: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}
