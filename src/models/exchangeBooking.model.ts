import { Collection } from "../infrastructure/firestore/collection.decorator";

@Collection('exchange_bookings')
export class ExchangeBooking {
  id: string = '';
  bookingReference!: string;
  userId?: string;
  name!: string;
  phone!: string;
  email!: string;
  fromCurrency!: string;
  toCurrency!: string;
  amountSent!: number;
  amountReceived!: number;
  exchangeRate!: number;
  locationId!: string;
  appointmentDate!: string;
  appointmentTime!: string;
  status!: 'confirmed' | 'pending';
  reminderSent!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}