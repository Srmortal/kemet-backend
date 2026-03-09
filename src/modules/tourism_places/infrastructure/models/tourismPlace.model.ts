export interface TourismPlace {
  category?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt?: Date;
  description?: string;
  governorate?: string;
  id?: string;
  location?: string;
  price?: number;
  rating?: number;
  title: string;
  [key: string]: unknown;
}
