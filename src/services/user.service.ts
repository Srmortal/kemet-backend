import { ApiError } from '../utils/ApiError';

// Simple in-memory user store for template/demo purposes.
// Replace with your DB implementation (e.g., Prisma, TypeORM, Mongoose).
interface UserRecord {
  id: string;
  email?: string;
  name?: string;
  password?: string;
  firebaseUid?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const users: UserRecord[] = [];

type UserPublic = Omit<UserRecord, 'password'>;

const toPublic = (u: UserRecord): UserPublic => ({
  id: u.id,
  email: u.email,
  name: u.name,
  firebaseUid: u.firebaseUid,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export class UserService {
  async getUserById(id: string) {
    const user = users.find((u) => u.id === id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return toPublic(user);
  }

  async getUserByEmail(email: string) {
    return users.find((u) => u.email === email);
  }

  async getUserByFirebaseUid(firebaseUid: string) {
    return users.find((u) => u.firebaseUid === firebaseUid) || null;
  }

  /**
   * Get a user by Firebase UID or create one using the supplied profile.
   * This supports Firebase-based authentication flows where users sign in
   * with Firebase and you want a corresponding application user record.
   */
  async getOrCreateFromFirebase(firebaseUid: string, profile: { email?: string; name?: string }) {
    const user = await this.getUserByFirebaseUid(firebaseUid);

    if (user) {
      return toPublic(user);
    }

    // Create a new user record mapped to the firebase UID
    const newUser: UserRecord = {
      id: Math.random().toString(36).substr(2, 9),
      email: profile.email,
      name: profile.name,
      firebaseUid,
      createdAt: new Date(),
    };

    users.push(newUser);

    return toPublic(newUser);
  }

  async updateUser(id: string, updateData: Partial<UserRecord>) {
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      throw new ApiError(404, 'User not found');
    }

    users[userIndex] = { ...users[userIndex], ...updateData, updatedAt: new Date() };

    return toPublic(users[userIndex]);
  }

  async deleteUser(id: string) {
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      throw new ApiError(404, 'User not found');
    }

    users.splice(userIndex, 1);
    return true;
  }

  async createUser(userData: Partial<UserRecord>) {
    const newUser: UserRecord = {
      id: Math.random().toString(36).substr(2, 9),
      email: userData.email,
      name: userData.name,
      password: userData.password,
      firebaseUid: userData.firebaseUid,
      createdAt: new Date(),
    };

    users.push(newUser);

    return toPublic(newUser);
  }
}
