import { GuideService } from "../src/services/guide.service";
import { Guide } from "../src/models/guide.model";

jest.mock("../src/repositories/guide.repository", () => {
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

describe("Guide Service", () => {
  const sampleGuide: Guide = {
    id: "1",
    name: "Dr. Khaled Mostafa",
    featured: true,
    rating: 4.9,
    reviews: 542,
    toursCount: 1240,
    pricePerDay: 1000,
    pricePerHour: 150,
    credentials: ["Licensed Egyptologist", "PhD", "UNESCO Certified"],
    languages: ["English", "Arabic", "French", "German"],
    specializations: ["Egyptology", "Ancient History", "Museums"],
    about: "Licensed Egyptologist with PhD in Ancient Egyptian History.",
    tours: [
      {
        name: "Pyramids of Giza Full Day Tour",
        description: "A full day tour of the Pyramids of Giza.",
        durationHours: 8,
        maxPeople: 8,
        price: 1200,
      },
    ],
  };

  let guideService: GuideService;

  beforeEach(() => {
    guideRepository.getAllGuides.mockReset();
    guideRepository.getGuideById.mockReset();
    guideRepository.isGuideAvailable.mockReset();
    guideRepository.createGuideBooking.mockReset();
    guideService = new GuideService(guideRepository);
  });

  describe("getGuides", () => {
    it("returns all guides", async () => {
      guideRepository.getAllGuides.mockResolvedValue([sampleGuide]);
      const result = await guideService.getGuides({ page: 1, limit: 10 });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.guides).toEqual([sampleGuide]);
    });

    it("handles repository errors", async () => {
      guideRepository.getAllGuides.mockRejectedValue(new Error("fail"));
      const result = await guideService.getGuides({ page: 1, limit: 10 });
      expect(result.ok).toBe(false);
    });
  });

  describe("getGuideById", () => {
    it("returns guide if found", async () => {
      guideRepository.getGuideById.mockResolvedValue(sampleGuide);
      const result = await guideService.getGuideById("1");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toEqual(sampleGuide);
    });

    it("returns error if not found", async () => {
      guideRepository.getGuideById.mockResolvedValue(null);
      const result = await guideService.getGuideById("2");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.type).toBe("NotFound");
    });

    it("handles repository errors", async () => {
      guideRepository.getGuideById.mockRejectedValue(new Error("fail"));
      const result = await guideService.getGuideById("1");
      expect(result.ok).toBe(false);
    });
  });
});
