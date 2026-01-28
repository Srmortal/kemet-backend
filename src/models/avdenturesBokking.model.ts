import { Collection } from "../infrastructure/firestore/collection.decorator";

@Collection('adventure_bookings')
export class AdventureBooking {
  id: string='';
  userId!: string;
  adventureId!: string;
  date!: string;
  guests!: number;
  specialRequests?: string;
  createdAt!: Date;
}