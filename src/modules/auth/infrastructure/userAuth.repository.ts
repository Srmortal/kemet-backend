import type { User } from "../../user/port/user.types.js";
import type { UserAuthRepository as UserAuthRepositoryPort } from "../port/user-auth-repository.js";

// In-memory storage for users
const usersStore: Map<
  string,
  User & { customClaims: { role: string; admin: boolean } }
> = new Map();

export class UserAuthRepository implements UserAuthRepositoryPort {
  async getById(uid: string): Promise<User | null> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    try {
      const user = usersStore.get(uid);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        roles: user.customClaims?.role ? [user.customClaims.role] : [],
        email: user.email,
        createdAt: user.createdAt,
        isActive: user.isActive,
      };
    } catch {
      return null;
    }
  }

  async setRoleAndAdmin(
    uid: string,
    role: string,
    admin = false
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const user = usersStore.get(uid);
    if (!user) {
      throw new Error(`User with id ${uid} not found`);
    }

    user.customClaims = { role, admin };
    usersStore.set(uid, user);
  }

  async createUser(uid: string, userData: Omit<User, "id">): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const user: User & { customClaims: { role: string; admin: boolean } } = {
      id: uid,
      ...userData,
      customClaims: { role: "user", admin: false },
    };

    usersStore.set(uid, user);
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      roles: ["user"],
      email: user.email,
      createdAt: user.createdAt,
      isActive: user.isActive,
    };
  }

  async deleteUser(uid: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    usersStore.delete(uid);
  }
}
