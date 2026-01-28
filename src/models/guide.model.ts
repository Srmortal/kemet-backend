import { Tour } from "./tour.model";

export interface Guide {
  id: string;
  name: string;
  featured: boolean;
  rating: number;
  reviews: number;
  toursCount: number;
  pricePerDay: number;
  pricePerHour: number;
  credentials: string[];
  languages: string[];
  specializations: string[];
  about: string;
  tours: Tour[];
}