export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  currency: 'EGP';
  rating: number;
  image: string;
  isBestseller?: boolean;
  isPremium?: boolean;
  discountPercent?: number;
  oldPrice?: number;
}