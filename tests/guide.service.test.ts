import type { GuideRepository } from "@features/guide";
import { GuideService } from "@features/guide/guide.service";
import type {
  CreateGuideBookingRequest,
  Guide,
  GuideBooking,
} from "@features/guide/port/guide.types";
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

const mockGuideRepository: GuideRepository = {
  getAllGuides: jest
    .fn<() => Promise<Guide[]>>()
    .mockResolvedValue([] as const),
  getGuideById: jest
    .fn<(id: string) => Promise<Guide | null>>()
    .mockResolvedValue(null),
  isGuideAvailable: jest
    .fn<(id: string) => Promise<boolean>>()
    .mockResolvedValue(false),
  createGuideBooking: jest
    .fn<(bookingData: CreateGuideBookingRequest) => Promise<GuideBooking>>()
    .mockResolvedValue({} as GuideBooking),
};

describe("Guide Service", () => {
  const sampleGuide: Guide = {
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

  let guideService: GuideService;

  beforeEach(() => {
    (mockGuideRepository.getAllGuides as jest.Mock).mockReset();
    (mockGuideRepository.getGuideById as jest.Mock).mockReset();
    (mockGuideRepository.isGuideAvailable as jest.Mock).mockReset();
    (mockGuideRepository.createGuideBooking as jest.Mock).mockReset();
    guideService = new GuideService(mockGuideRepository);
  });

  describe("getGuides", () => {
    it("returns all guides", async () => {
      (
        mockGuideRepository.getAllGuides as jest.Mock<() => Promise<Guide[]>>
      ).mockResolvedValue([sampleGuide]);
      const result = await guideService.getGuides({ page: 1, limit: 10 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.guides).toEqual([sampleGuide]);
      }
    });

    it("handles repository errors", async () => {
      (
        mockGuideRepository.getAllGuides as jest.Mock<() => Promise<Guide[]>>
      ).mockRejectedValue(new Error("fail"));
      const result = await guideService.getGuides({ page: 1, limit: 10 });
      expect(result.ok).toBe(false);
    });
  });

  describe("getGuideById", () => {
    it("returns guide if found", async () => {
      (
        mockGuideRepository.getGuideById as jest.Mock<
          (id: string) => Promise<Guide | null>
        >
      ).mockResolvedValue(sampleGuide);
      const result = await guideService.getGuideById("1");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(sampleGuide);
      }
    });

    it("returns error if not found", async () => {
      (
        mockGuideRepository.getGuideById as jest.Mock<
          (id: string) => Promise<Guide | null>
        >
      ).mockResolvedValue(null);
      const result = await guideService.getGuideById("2");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("NotFound");
      }
    });

    it("handles repository errors", async () => {
      (
        mockGuideRepository.getGuideById as jest.Mock<
          (id: string) => Promise<Guide | null>
        >
      ).mockRejectedValue(new Error("fail"));
      const result = await guideService.getGuideById("1");
      expect(result.ok).toBe(false);
    });
  });
});
