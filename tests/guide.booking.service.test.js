import { GuideService } from "@features/guide/guide.service";
import { describe, expect, it, jest } from "@jest/globals";

const mockGuideRepository = {
  getAllGuides: jest.fn(),
  getGuideById: jest.fn(),
  isGuideAvailable: jest.fn(),
  createGuideBooking: jest.fn(),
};
jest.mock("@features/guide/port/guide-repository", () => ({
  __esModule: true,
  guideRepository: mockGuideRepository,
}));
const guideRepository = mockGuideRepository;
describe("Guide Booking Service", () => {
  const bookingRequest = {
    guideId: "1",
    date: "2026-01-31",
    startTime: "09:00",
    hours: 8,
    people: 2,
    fullName: "Ahmed Youssef",
    email: "ahmed@example.com",
    phone: "+201234567890",
  };
  const guide = {
    id: "1",
    name: "Dr. Khaled Mostafa",
    rating: 4.9,
    reviews: 542,
    languages: ["English", "Arabic"],
    specialties: ["Pyramids of Giza", "Egyptian Museum"],
  };
  const booking = {
    bookingReference: "GUIDE-96608874",
    guide,
    date: "2026-01-31",
    people: 2,
    totalPaid: 300,
    paymentSummary: { guideService: 300, total: 300 },
  };
  let guideService;
  beforeEach(() => {
    guideRepository.getGuideById.mockReset();
    guideRepository.isGuideAvailable.mockReset();
    guideRepository.createGuideBooking.mockReset();
    guideService = new GuideService(guideRepository);
  });
  it("returns booking on success", async () => {
    guideRepository.getGuideById.mockResolvedValue(guide);
    guideRepository.isGuideAvailable.mockResolvedValue(true);
    guideRepository.createGuideBooking.mockResolvedValue(booking);
    const result = await guideService.bookGuide(bookingRequest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(booking);
    }
  });
  it("returns NotFound if guide does not exist", async () => {
    guideRepository.getGuideById.mockResolvedValue(null);
    const result = await guideService.bookGuide(bookingRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("NotFound");
    }
  });
  it("returns Conflict if guide not available", async () => {
    guideRepository.getGuideById.mockResolvedValue(guide);
    guideRepository.isGuideAvailable.mockResolvedValue(false);
    const result = await guideService.bookGuide(bookingRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("Conflict");
    }
  });
  it("returns error on repository failure", async () => {
    guideRepository.getGuideById.mockRejectedValue(new Error("fail"));
    const result = await guideService.bookGuide(bookingRequest);
    expect(result.ok).toBe(false);
  });
});
//# sourceMappingURL=guide.booking.service.test.js.map
