import { getGuides, getGuideById, Guide, GuideRepository } from "../services/guide.service";
import { Result } from "../types/result.types";

describe("Guide Service", () => {
  let repo: jest.Mocked<GuideRepository>;
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

  beforeEach(() => {
    repo = {
      getAllGuides: jest.fn(),
      getGuideById: jest.fn(),
    };
  });

  describe("getGuides", () => {
    it("returns all guides", async () => {
      repo.getAllGuides.mockResolvedValue([sampleGuide]);
      const result = await getGuides(repo);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toEqual([sampleGuide]);
    });

    it("handles repository errors", async () => {
      repo.getAllGuides.mockRejectedValue(new Error("fail"));
      const result = await getGuides(repo);
      expect(result.ok).toBe(false);
    });
  });

  describe("getGuideById", () => {
    it("returns guide if found", async () => {
      repo.getGuideById.mockResolvedValue(sampleGuide);
      const result = await getGuideById(repo, "1");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toEqual(sampleGuide);
    });

    it("returns error if not found", async () => {
      repo.getGuideById.mockResolvedValue(null);
      const result = await getGuideById(repo, "2");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe("GuideNotFound");
    });

    it("handles repository errors", async () => {
      repo.getGuideById.mockRejectedValue(new Error("fail"));
      const result = await getGuideById(repo, "1");
      expect(result.ok).toBe(false);
    });
  });
});
