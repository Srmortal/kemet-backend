import { Guide } from "@models/guide.model";
import { mockGuides } from "@utils/generateMockGuides";
import { GuideBooking } from "@models/guide-booking.model";
import { FirestoreOrm } from "@infrastructure/firestore/firestoreOrm";

const bookingOrm = FirestoreOrm.fromModel(GuideBooking);

export const guideRepository = {
  getAllGuides: async (): Promise<Guide[]> => {
    return mockGuides;
  },
  getGuideById: async (id: string): Promise<Guide | null> => {
    const guide = mockGuides.find(g => g.id === id);
    return guide || null;
  },
  isGuideAvailable: async (
    guideId: string,
    date: string,
    startTime: string,
    hours: number
  ): Promise<boolean> => {
    // Find bookings for this guide on the same date
    const bookings = await bookingOrm.find({
      guideId,
      date,
    });

    // Convert startTime to minutes for comparison
    const reqStart = parseInt(startTime.replace(":", ""), 10);
    const reqEnd = reqStart + hours * 100; // crude, assumes "HHmm" format

    // Check for time overlap with any existing booking
    for (const booking of bookings) {
      const bookingStart = parseInt(booking.startTime.replace(":", ""), 10);
      const bookingEnd = bookingStart + booking.hours * 100;
      // Overlap if requested start < existing end and requested end > existing start
      if (reqStart < bookingEnd && reqEnd > bookingStart) {
        return false;
      }
    }
    return true;
  },
  async createGuideBooking(bookingData: {
    guideId: string;
    date: string;
    startTime: string;
    hours: number;
    people: number;
    fullName: string;
    email: string;
    phone: string;
  }) {
    // Calculate payment (stub, replace with real logic)
    const guideService = 100 * bookingData.hours; // Example calculation
    const total = guideService;

    const booking: Omit<GuideBooking, "id"> = {
      ...bookingData,
      totalPaid: total,
      paymentSummary: { guideService, total },
      createdAt: Date.now(),
    };

    const created = await bookingOrm.create(booking);
    return {
      bookingReference: created.id,
      ...bookingData,
      totalPaid: created.totalPaid,
      paymentSummary: created.paymentSummary,
    };
  },
};