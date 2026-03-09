import type {
  CreateRepository,
  FindByIdRepository,
  FindManyMethodRepository,
  GetAllRepository,
} from "#app/shared/ports/generic-repository.js";
import type { Adventure, AdventureBooking } from "./adventure.types.js";
export interface AdventureRepository
  extends CreateRepository<Omit<AdventureBooking, "id">, AdventureBooking>,
    FindByIdRepository<Adventure, string, null>,
    FindManyMethodRepository<"findByUserId", string, AdventureBooking>,
    GetAllRepository<Adventure> {}
