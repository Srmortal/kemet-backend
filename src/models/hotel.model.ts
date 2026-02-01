export interface Hotel {
  id: number;
  name: string;
  governorate: string;
  city: string;
  stars: 3 | 4 | 5;
  rating: number;
  reviewsCount: number;
  currency: 'EGP';
  thumbnail: string;
}