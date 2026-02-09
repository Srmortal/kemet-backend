export type TourismPlace = {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  governorate?: string;
  category?: string;
  price?: number;
  rating?: number;
  createdAt?: Date;
  [key: string]: unknown;
};

export interface TourismRepository {
  queryBuilder(): any;
  getById(id: string): Promise<TourismPlace | null>;
  getAll(): Promise<TourismPlace[]>;
  enrichPlaceData(place: TourismPlace): TourismPlace;
  getPlacesWithFilters(params: {
    location?: string;
    category?: string;
    sortBy?: string;
    pageNum: number;
    pageSize: number;
  }): Promise<{ places: TourismPlace[]; totalCount: number }>;
}