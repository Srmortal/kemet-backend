import { GuideService } from "../src/services/guide.service";

jest.mock("../src/repositories/guide.repository", () => {
  // Define the mock object here
  return {
    __esModule: true,
    guideRepository: {
      getAllGuides: jest.fn(),
      getGuideById: jest.fn(),
      isGuideAvailable: jest.fn(),
      createGuideBooking: jest.fn(),
    },
  };
});

// Import the mock after jest.mock so it's the same instance
import { guideRepository as originalGuideRepository } from "../src/repositories/guide.repository";

// Cast repository methods to jest.Mock for type safety in tests
const guideRepository = {
  getAllGuides: originalGuideRepository.getAllGuides as jest.Mock,
  getGuideById: originalGuideRepository.getGuideById as jest.Mock,
  isGuideAvailable: originalGuideRepository.isGuideAvailable as jest.Mock,
  createGuideBooking: originalGuideRepository.createGuideBooking as jest.Mock,
};

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
  const guide = { id: "1", name: "Dr. Khaled Mostafa" };
  const booking = {
    bookingReference: "GUIDE-96608874",
    guide,
    date: "2026-01-31",
    people: 2,
    totalPaid: 300,
    paymentSummary: { guideService: 300, total: 300 },
  };

  let guideService: GuideService;

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
    if (result.ok) expect(result.value).toEqual(booking);
  });

  it("returns NotFound if guide does not exist", async () => {
    guideRepository.getGuideById.mockResolvedValue(null);
    const result = await guideService.bookGuide(bookingRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("NotFound");
  });

  it("returns Conflict if guide not available", async () => {
    guideRepository.getGuideById.mockResolvedValue(guide);
    guideRepository.isGuideAvailable.mockResolvedValue(false);
    const result = await guideService.bookGuide(bookingRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("Conflict");
  });

  it("returns error on repository failure", async () => {
    guideRepository.getGuideById.mockRejectedValue(new Error("fail"));
    const result = await guideService.bookGuide(bookingRequest);
    expect(result.ok).toBe(false);
  });
});
