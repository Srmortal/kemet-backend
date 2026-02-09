import { Guide } from "@models/guide.model";

export interface GuideRepository {
  getAllGuides(): Promise<Guide[]>;
  getGuideById(id: string): Promise<Guide | null>;
  isGuideAvailable(
    guideId: string,
    date: string,
    startTime: string,
    hours: number
  ): Promise<boolean>;
  createGuideBooking(bookingData: {
    guideId: string;
    date: string;
    startTime: string;
    hours: number;
    people: number;
    fullName: string;
    email: string;
    phone: string;
  }): Promise<any>;
}