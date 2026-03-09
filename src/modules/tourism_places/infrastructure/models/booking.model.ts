export class Booking {
  id = "";
  userId!: string;
  placeId!: string;
  placeTitle!: string;
  guests!: number;
  specialRequests?: string;
  date!: string;
  time?: string;
  pricePerPerson!: number;
  totalPrice!: number;
  status!: "confirmed" | "cancelled";
  createdAt!: Date;
  updatedAt!: Date;
}
