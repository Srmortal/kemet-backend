import type { User } from "#app/modules/user/port/user.types.js";
import type { GetByIdMethodRepository } from "#app/shared/ports/generic-repository.js";

export interface UserAuthRepository
  extends GetByIdMethodRepository<"getById", User, string, null> {
  setRoleAndAdmin(uid: string, role: string, admin?: boolean): Promise<void>;
}
