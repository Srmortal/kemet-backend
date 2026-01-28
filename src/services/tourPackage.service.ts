// Pure business logic for tour packages
// No HTTP, controller, or OpenAPI imports


import { tourPackageRepository, TourPackage } from '@repositories/tourPackage.repository';
import { Result, ok, err } from '../types/result.types';
import type { DomainError } from '../types/domain-error.type';

export const tourPackageService = {
  getAllTourPackages: async (options: { category?: string; page?: number; limit?: number }): Promise<Result<TourPackage[], DomainError>> => {
    try {
      const result = await tourPackageRepository.getAll(options);
      return ok(result);
    } catch (e) {
      return err({ type: 'Unknown', message: 'Unknown error' });
    }
  },

  getTourPackageById: async (id: string): Promise<Result<TourPackage, DomainError>> => {
    try {
      const found = await tourPackageRepository.getById(id);
      if (!found) return err({ type: 'NotFound', message: 'Tour package not found' });
      return ok(found);
    } catch (e) {
      return err({ type: 'Unknown', message: 'Unknown error' });
    }
  }
};
