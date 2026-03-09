export class AdventureBooking {
  id = "";
  userId!: string;
  adventureId!: string;
  date!: string;
  guests!: number;
  specialRequests?: string;
  createdAt!: Date;
}
