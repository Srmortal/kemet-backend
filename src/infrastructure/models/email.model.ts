export interface BookingEmailDetails {
  bookingId: string;
  date: string;
  email: string;
  guests: number;
  placeTitle: string;
  totalPrice: number;
  userName?: string;
}
