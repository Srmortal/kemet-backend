import { ok, err, Result } from '../types/result.types';
import type { DomainError } from '../types/domain-error.type';
import { Adventure } from '@models/adventures.model';
import type { AdventureRepository } from '../ports/adventure-repository';

export class AdventureService {
  constructor(private repo: AdventureRepository) {}

  async getAdventures() {
    return ok(await this.repo.getAll());
  }

  async getAdventureById(id: string): Promise<Result<Adventure, DomainError>> {
    const adventure = await this.repo.findById(id);
    if (!adventure) return err({ type: 'NotFound', message: 'Adventure not found' });
    return ok(adventure);
  }
}
