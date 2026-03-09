import type { Tour } from "./tour.model.js";

export interface Guide {
  about: string;
  credentials: string[];
  featured: boolean;
  id: string;
  languages: string[];
  name: string;
  pricePerDay: number;
  pricePerHour: number;
  rating: number;
  reviews: number;
  specializations: string[];
  tours: Tour[];
  toursCount: number;
}
