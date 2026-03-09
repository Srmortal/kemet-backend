export class GuideBooking {
  id?: string;
  guideId!: string;
  date!: string;
  startTime!: string;
  hours!: number;
  people!: number;
  fullName!: string;
  email!: string;
  phone!: string;
  totalPaid!: number;
  paymentSummary!: { guideService: number; total: number };
  createdAt!: number;
}
