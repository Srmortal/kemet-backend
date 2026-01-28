import { Adventure } from '../models/adventures.model';
import { adventuresMock } from '../utils/mockAdventuresGenerator';

export class AdventureRepository {
  async findById(id: string): Promise<Adventure | null> {
    return adventuresMock.find(a => a.id === id) || null;
  }
  
  async getAll(): Promise<Adventure[]> {
    return adventuresMock;
  }
}
export const adventureRepository = new AdventureRepository();