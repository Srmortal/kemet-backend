import type { DomainError } from "../../../shared/types/domain-error.type.js";
import { err, ok, type Result } from "../../../shared/types/result.types.js";
import type { Adventure } from "../infrastructure/models/adventures.model.js";
import type { AdventureRepository } from "../port/adventure.repository.js";

export class AdventureService {
  private readonly repo: AdventureRepository;

  constructor(adventureRepository: AdventureRepository) {
    this.repo = adventureRepository;
  }

  async getAdventures() {
    return ok(await this.repo.getAll());
  }

  async getAdventureById(id: string): Promise<Result<Adventure, DomainError>> {
    const adventure = await this.repo.findById(id);
    if (!adventure) {
      return err({ type: "NotFound", message: "Adventure not found" });
    }
    return ok(adventure);
  }
}
