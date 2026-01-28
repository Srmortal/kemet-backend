import { ok, err, Result } from '../types/result.types';
import type { DomainError } from '../types/domain-error.type';
import { Adventure } from '@models/adventures.model';
import { adventureRepository } from '@repositories/adventure.repository';

class AdventureService {
  async getAdventures() {
    return ok(await adventureRepository.getAll());
  }

  async getAdventureById(id: string): Promise<Result<Adventure, DomainError>> {
    const adventure = await adventureRepository.findById(id);
    if (!adventure) return err({ type: 'NotFound', message: 'Adventure not found' });
    return ok(adventure);
  }
}

export const adventureService = new AdventureService();
