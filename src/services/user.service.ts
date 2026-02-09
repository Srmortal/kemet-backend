import { DomainError } from '../types/domain-error.type';
import { err, ok, Result } from '../types/result.types';
import type { UserRepository } from '../ports/user-repository';
import type { UserAuthRepository } from '../ports/user-auth-repository';

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bookingsCount: number;
  favouritesCount: number;
  bio?: string;
  role?: 'user' | 'admin';
  admin?: boolean;
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: Date | string;
  gender?: 'M' | 'F';
  expiryDate?: Date | string;
}

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private authRepo: UserAuthRepository
  ) {}

  async upsertUserWithRole(firebaseUser: {
    id: string;
    email?: string;
    name?: string;
    role?: 'user' | 'admin';
    admin?: boolean;
    [key: string]: unknown;
  }): Promise<Result<AppUser, DomainError>> {
    const userRecord = await this.authRepo.getById(firebaseUser.id);
    if (!userRecord) {
      return err({ type: 'NotFound', message: 'Firebase Auth user not found' });
    }

    let userData = await this.userRepo.getById(firebaseUser.id);
    if (!userData) {
      userData = {
        id: firebaseUser.id,
        email: firebaseUser.email,
        name: firebaseUser.name,
        role: firebaseUser.role ?? 'user',
        admin: firebaseUser.admin ?? false,
        bookingsCount: 0,
        favouritesCount: 0,
      } as any;
      await this.userRepo.create(userData as any);
    }

    const customClaims = userRecord.customClaims || {};
    let role = userData?.role ?? customClaims.role;
    let admin = userData?.admin ?? customClaims.admin;
    let claimsNeedUpdate = false;
    if (!role) {
      role = 'user';
      claimsNeedUpdate = true;
    }
    if (admin === undefined) {
      admin = false;
      claimsNeedUpdate = true;
    }
    if (claimsNeedUpdate) {
      await this.authRepo.setRoleAndAdmin(firebaseUser.id, role, admin);
    }

    return ok({
      id: firebaseUser.id,
      email: userRecord.email,
      name: userRecord.displayName,
      role,
      admin,
      ...userData,
    } as AppUser);
  }

  async updateUserWithAdditionalData(
    id: string,
    additionalData: Record<string, unknown>
  ): Promise<Result<AppUser, DomainError>> {
    let user = await this.userRepo.getById(id);
    if (user) {
      const updateResult = await this.userRepo.update(id, additionalData);
      if (!updateResult) {
        return err({ type: 'Unknown', message: 'Failed to update user' });
      }
      return ok({ ...user, ...additionalData, id: user.id ?? id } as AppUser);
    } else {
      const newUser: any = {
        id, ...additionalData,
        bookingsCount: 0,
        favouritesCount: 0
      };
      const createResult = await this.userRepo.create(newUser);
      if (!createResult) {
        return err({ type: 'Unknown', message: 'Failed to create user with additional data' });
      }
      return ok(newUser as AppUser);
    }
  }

  private toPublicProfile(user: AppUser): AppUser {
    const { role, admin, ...rest } = user;
    return rest as AppUser;
  }

  async getUserProfileService(id: string): Promise<Result<AppUser, DomainError>> {
    try {
      const user = await this.userRepo.getById(id);
      if (!user) {
        return err({ type: 'NotFound', message: 'User not found' });
      }
      return ok(this.toPublicProfile(user as AppUser));
    } catch (e) {
      return err({ type: 'Unknown', message: 'Failed to get user profile' });
    }
  }
}