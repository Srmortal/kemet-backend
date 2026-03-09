import { describe, expect, it } from "@jest/globals";

const tourPackageService = {
  _test_getAllTourPackages: (packages, filters) => {
    let filtered = packages;
    if (filters.category) {
      filtered = filtered.filter((pkg) => pkg.category === filters.category);
    }
    if (filters.page && filters.limit) {
      const start = (filters.page - 1) * filters.limit;
      filtered = filtered.slice(start, start + filters.limit);
    }
    return { ok: true, value: filtered };
  },
  _test_getTourPackageById: (packages, id) => {
    const found = packages.find((pkg) => pkg.id === id);
    if (found) {
      return { ok: true, value: found };
    }
    return {
      ok: false,
      error: {
        message: "Tour package not found",
        type: "NotFound",
      },
    };
  },
};
const mockPackages = [
  {
    id: "1",
    name: "Nile Adventure",
    image: "nile.jpg",
    pricePerPerson: 100,
    discount: 10,
    rating: 4.5,
    location: "Cairo",
    availableLanguages: ["en", "ar"],
    included: ["Guide", "Meals"],
    itinerary: ["Day 1: Cairo", "Day 2: Luxor"],
    duration: "2 days",
    groupSize: { min: 2, max: 10 },
    category: "adventure",
  },
  {
    id: "2",
    name: "Desert Safari",
    image: "desert.jpg",
    pricePerPerson: 80,
    discount: undefined,
    rating: 4.0,
    location: "Giza",
    availableLanguages: ["en"],
    included: ["Transport"],
    itinerary: ["Day 1: Giza"],
    duration: "1 day",
    groupSize: { min: 1, max: 5 },
    category: "safari",
  },
];
describe("tourPackageService", () => {
  describe("getAllTourPackages", () => {
    it("returns all packages if no filters", () => {
      const result = tourPackageService._test_getAllTourPackages(
        mockPackages,
        {}
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
      }
    });
    it("filters by category if provided", () => {
      const result = tourPackageService._test_getAllTourPackages(mockPackages, {
        category: "adventure",
      });
      if (result.ok) {
        expect(result.value.length).toBe(1);
        expect(result.value[0].category).toBe("adventure");
      } else {
        throw new Error("Service returned error");
      }
    });
    it("applies pagination if page and limit are provided", () => {
      const result = tourPackageService._test_getAllTourPackages(mockPackages, {
        page: 2,
        limit: 1,
      });
      expect(result.ok && result.value.length === 1).toBe(true);
      expect(result.ok && result.value[0].id === "2").toBe(true);
    });
    it("returns empty array if no packages match category", () => {
      const result = tourPackageService._test_getAllTourPackages(mockPackages, {
        category: "nonexistent",
      });
      expect(result.ok && result.value.length === 0).toBe(true);
    });
  });
  describe("getTourPackageById", () => {
    it("returns the correct package by id", () => {
      const result = tourPackageService._test_getTourPackageById(
        mockPackages,
        "1"
      );
      expect(result.ok && result.value.id === "1").toBe(true);
    });
    it("returns error result if not found", () => {
      const result = tourPackageService._test_getTourPackageById(
        mockPackages,
        "not-exist"
      );
      expect(result).toEqual({
        ok: false,
        error: {
          message: "Tour package not found",
          type: "NotFound",
        },
      });
    });
  });
});
//# sourceMappingURL=tourPackage.service.test.js.map
