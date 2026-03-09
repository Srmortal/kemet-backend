import type {
  CreateUserRequest,
  User as UserPortType,
} from "../port/user.types.js";
import type { UserRepository as UserRepositoryPort } from "../port/user-repository.js";
import type { User } from "./user.model.js";

// In-memory storage for users
const usersStore: Map<string, User> = new Map();
let userIdCounter = 1;

export class UserRepository implements UserRepositoryPort {
  async getById(uid: string): Promise<UserPortType | null> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    try {
      const user = usersStore.get(uid);
      return user ? this.mapToPortType(user) : null;
    } catch {
      return null;
    }
  }

  async create(data: CreateUserRequest): Promise<UserPortType> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const id = `user_${userIdCounter++}`;
    const user: User = {
      id,
      email: data.email,
      name: data.displayName,
      createdAt: new Date().toISOString(),
      bookingsCount: 0,
      favouritesCount: 0,
    };

    usersStore.set(id, user);
    return this.mapToPortType(user);
  }

  async update(
    id: string,
    data: Partial<UserPortType>
  ): Promise<UserPortType | null> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const user = usersStore.get(id);
    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      ...(data.displayName && { name: data.displayName }),
      ...(data.email && { email: data.email }),
      ...(data.avatar && { avatarUrl: data.avatar }),
    };

    usersStore.set(id, updatedUser);
    return this.mapToPortType(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    usersStore.delete(id);
  }

  async getAll(): Promise<UserPortType[]> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const users = Array.from(usersStore.values());
    return users.map((user) => this.mapToPortType(user));
  }

  async find(filter: Partial<UserPortType>): Promise<UserPortType[]> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const users = Array.from(usersStore.values());
    return users
      .filter((user) => {
        if (filter.email && user.email !== filter.email) {
          return false;
        }
        if (filter.username && user.name !== filter.username) {
          return false;
        }
        if (filter.id && user.id !== filter.id) {
          return false;
        }
        return true;
      })
      .map((user) => this.mapToPortType(user));
  }

  private mapToPortType(user: User): UserPortType {
    return {
      id: user.id || "",
      username: user.name || "",
      email: user.email || "",
      displayName: user.name || "",
      avatar: user.avatarUrl || "",
      roles: [],
      createdAt: user.createdAt?.toString() || "",
      isActive: true,
    };
  }
}
