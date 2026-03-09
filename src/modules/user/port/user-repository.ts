import type {
  CreateRepository,
  DeleteRepository,
  FindManyRepository,
  GetAllRepository,
  GetByIdMethodRepository,
  UpdateRepository,
} from "#app/shared/ports/generic-repository.js";
import type { CreateUserRequest, User } from "./user.types.js";

export interface UserRepository
  extends CreateRepository<CreateUserRequest, User>,
    UpdateRepository<Partial<User>, User, string, null>,
    DeleteRepository<string, void>,
    FindManyRepository<Partial<User>, User>,
    GetAllRepository<User>,
    GetByIdMethodRepository<"getById", User, string, null> {}
