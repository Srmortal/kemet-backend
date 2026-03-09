export class TourPackageBooking {
  id?: string;
  userId!: string;
  packageId!: string;
  guests!: number;
  date!: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
