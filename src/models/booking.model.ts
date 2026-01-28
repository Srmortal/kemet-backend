import { Collection } from "../infrastructure/firestore/collection.decorator";

@Collection('tourism_site_bookings')
export class Booking {
  id: string = '';
  userId!: string;
  placeId!: string;
  placeTitle!: string;
  guests!: number;
  specialRequests?: string;
  date!: string;
  time?: string;
  pricePerPerson!: number;
  totalPrice!: number;
  status!: 'confirmed' | 'cancelled';
  createdAt!: Date;
  updatedAt!: Date;
}