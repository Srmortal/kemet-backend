import type { TourPackage } from '../repositories/tourPackage.repository';

export interface TourPackageRepository {
  getAll(options: { category?: string; page?: number; limit?: number }): Promise<TourPackage[]>;
  getById(id: string): Promise<TourPackage | undefined>;
}