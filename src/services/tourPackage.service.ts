// Pure business logic for tour packages
// No HTTP, controller, or OpenAPI imports


import { Result, ok, err } from '../types/result.types';
import type { DomainError } from '../types/domain-error.type';
import type { TourPackageRepository } from '../ports/tour-package-repository';
import type { TourPackage } from '../repositories/tourPackage.repository'; // Import only the Type

export class TourPackageService {
  constructor(private repo: TourPackageRepository) {}

  async getAllTourPackages(options: { category?: string; page?: number; limit?: number }): Promise<Result<TourPackage[], DomainError>> {
    try {
      const result = await this.repo.getAll(options);
      return ok(result);
    } catch (e) {
      return err({ type: 'Unknown', message: 'Unknown error' });
    }
  }

  async getTourPackageById(id: string): Promise<Result<TourPackage, DomainError>> {
    try {
      const found = await this.repo.getById(id);
      if (!found) return err({ type: 'NotFound', message: 'Tour package not found' });
      return ok(found);
    } catch (e) {
      return err({ type: 'Unknown', message: 'Unknown error' });
    }
  }
}
