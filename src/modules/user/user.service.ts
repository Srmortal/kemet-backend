import type { DomainError } from "../../shared/types/domain-error.type.js";
import { err, ok, type Result } from "../../shared/types/result.types.js";
import type { UserRepository } from "./port/user-repository.js";

export interface AppUser {
  admin?: boolean;
  avatarUrl?: string;
  bio?: string;
  bookingsCount: number;
  dateOfBirth?: Date | string;
  email?: string;
  expiryDate?: Date | string;
  favouritesCount: number;
  gender?: "M" | "F";
  id: string;
  name?: string;
  nationality?: string;
  passportNumber?: string;
  phoneNumber?: string;
  role?: "user" | "admin";
}

export class UserService {
  private readonly userRepo: UserRepository;

  constructor(userRepo: UserRepository) {
    this.userRepo = userRepo;
  }

  async getUserProfileService(
    id: string
  ): Promise<Result<AppUser, DomainError>> {
    try {
      const user = await this.userRepo.getById(id);
      if (!user) {
        return err({ type: "NotFound", message: "User not found" });
      }
      return ok({
        ...user,
        bookingsCount: (user as unknown as AppUser).bookingsCount ?? 0,
        favouritesCount: (user as unknown as AppUser).favouritesCount ?? 0,
      } as AppUser);
    } catch {
      return err({ type: "Unknown", message: "Failed to get user profile" });
    }
  }
}
