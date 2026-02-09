import { generateMockTourPackages } from '../utils/mockTourPackages';
import type { TourPackageRepository as TourPackageRepositoryPort } from '../ports/tour-package-repository';

export type TourPackage = ReturnType<typeof generateMockTourPackages>[number];
const tourPackages: TourPackage[] = generateMockTourPackages(20);

export class TourPackageRepository implements TourPackageRepositoryPort {
  async getAll(options: { category?: string; page?: number; limit?: number }) {
    let result = tourPackages;
    if (options.category) {
      result = result.filter((pkg) => pkg.category === options.category);
    }
    if (options.page && options.limit) {
      const start = (options.page - 1) * options.limit;
      result = result.slice(start, start + options.limit);
    }
    return result;
  }

  async getById(id: string) {
    return tourPackages.find((pkg) => pkg.id === id);
  }
}

export const tourPackageRepository = new TourPackageRepository();
