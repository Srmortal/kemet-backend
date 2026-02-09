import { Adventure } from '../models/adventures.model';
import { adventuresMock } from '../utils/mockAdventuresGenerator';
import type { AdventureRepository as AdventureRepositoryPort } from '../ports/adventure-repository';

export class AdventureRepository implements AdventureRepositoryPort {
  async findById(id: string): Promise<Adventure | null> {
    return adventuresMock.find(a => a.id === id) || null;
  }
  
  async getAll(): Promise<Adventure[]> {
    return adventuresMock;
  }
}
export const adventureRepository = new AdventureRepository();