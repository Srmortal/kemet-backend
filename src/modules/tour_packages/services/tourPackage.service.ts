// Pure business logic for tour packages
// No HTTP, controller, or OpenAPI imports

import type { DomainError } from "#app/shared/types/domain-error.type.js";
import { err, ok, type Result } from "#app/shared/types/result.types.js";
import type { TourPackageRepository } from "../port/tour-package-repository.js";
import type {
  TourPackageDetail,
  TourPackageSummary,
} from "../port/tourPackage.types.js";
export class TourPackageService {
  private readonly repo: TourPackageRepository;

  constructor(tourPackageRepository: TourPackageRepository) {
    this.repo = tourPackageRepository;
  }

  async getAllTourPackages(options: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<TourPackageSummary[], DomainError>> {
    try {
      const result = await this.repo.getAll(options);
      return ok(result);
    } catch {
      return err({ type: "Unknown", message: "Unknown error" });
    }
  }

  async getTourPackageById(
    id: string
  ): Promise<Result<TourPackageDetail, DomainError>> {
    try {
      const found = await this.repo.getById(id);
      if (!found) {
        return err({ type: "NotFound", message: "Tour package not found" });
      }
      return ok(found);
    } catch {
      return err({ type: "Unknown", message: "Unknown error" });
    }
  }
}
