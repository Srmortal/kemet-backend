import { Collection } from "../infrastructure/firestore/collection.decorator";

@Collection('hotel_bookings')
export class HotelBooking {
  id: string = '';
  userId!: string;
  hotelId!: string;
  roomId!: string;
  checkIn!: string;
  checkOut!: string;
  guests!: number;
  guestName!: string;
  guestEmail!: string;
  guestPhone!: string;
  specialRequests?: string;
  pricePerNight!: number;
  nights!: number;
  subtotal!: number;
  serviceFee!: number;
  discountPercent!: number;
  discountAmount!: number;
  totalPrice!: number;
  paymentCurrency!: string;
  status!: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  qrCode!: string;
  createdAt!: Date;
  updatedAt!: Date;
  paymentStatus!: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod!: 'card' | 'cash' | 'wallet' | 'bank_transfer';
  paymentTransactionId?: string;
  paymentAmount?: number;
  paymentDate?: Date | string;
}
