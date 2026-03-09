import { GuideService } from "@features/guide/guide.service";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("@features/guide/port/guide-repository", () => {
  return {
    __esModule: true,
    GuideRepository: {
      getAllGuides: jest.fn(),
      getGuideById: jest.fn(),
      isGuideAvailable: jest.fn(),
      createGuideBooking: jest.fn(),
    },
  };
});
const mockGuideRepository = {
  getAllGuides: jest.fn().mockResolvedValue([]),
  getGuideById: jest.fn().mockResolvedValue(null),
  isGuideAvailable: jest.fn().mockResolvedValue(false),
  createGuideBooking: jest.fn().mockResolvedValue({}),
};
describe("Guide Service", () => {
  const sampleGuide = {
    id: "1",
    name: "Dr. Khaled Mostafa",
    rating: 4.9,
    reviews: 542,
    languages: ["English", "Arabic", "French", "German"],
    specialties: [
      "Pyramids of Giza",
      "Egyptian Museum",
      "Khan El Khalili Bazaar",
      "Coptic Cairo",
    ],
  };
  let guideService;
  beforeEach(() => {
    mockGuideRepository.getAllGuides.mockReset();
    mockGuideRepository.getGuideById.mockReset();
    mockGuideRepository.isGuideAvailable.mockReset();
    mockGuideRepository.createGuideBooking.mockReset();
    guideService = new GuideService(mockGuideRepository);
  });
  describe("getGuides", () => {
    it("returns all guides", async () => {
      mockGuideRepository.getAllGuides.mockResolvedValue([sampleGuide]);
      const result = await guideService.getGuides({ page: 1, limit: 10 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.guides).toEqual([sampleGuide]);
      }
    });
    it("handles repository errors", async () => {
      mockGuideRepository.getAllGuides.mockRejectedValue(new Error("fail"));
      const result = await guideService.getGuides({ page: 1, limit: 10 });
      expect(result.ok).toBe(false);
    });
  });
  describe("getGuideById", () => {
    it("returns guide if found", async () => {
      mockGuideRepository.getGuideById.mockResolvedValue(sampleGuide);
      const result = await guideService.getGuideById("1");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(sampleGuide);
      }
    });
    it("returns error if not found", async () => {
      mockGuideRepository.getGuideById.mockResolvedValue(null);
      const result = await guideService.getGuideById("2");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("NotFound");
      }
    });
    it("handles repository errors", async () => {
      mockGuideRepository.getGuideById.mockRejectedValue(new Error("fail"));
      const result = await guideService.getGuideById("1");
      expect(result.ok).toBe(false);
    });
  });
});
//# sourceMappingURL=guide.service.test.js.map
