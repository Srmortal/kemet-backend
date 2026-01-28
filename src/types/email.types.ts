export interface BookingEmailDetails {
  email: string;
  userName?: string;
  bookingId: string;
  placeTitle: string;
  date: string;
  guests: number;
  totalPrice: number;
}
