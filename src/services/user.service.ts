import { userRepository } from '@repositories/user.repository';
import { userAuthRepository } from '@repositories/userAuth.repository';
import { DomainError } from '../types/domain-error.type';
import { err, ok, Result } from '../types/result.types';

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  admin?: boolean;
  customClaims?: Record<string, unknown>;
  // Add other fields as needed
}


/**
 * Upserts a user in Firestore and merges with Firebase Auth custom claims.
 * Ensures role/admin are set and synced as needed.
 * @param firebaseUser The user object from Firebase Auth (req.user)
 */
export async function upsertUserWithRole(firebaseUser: {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  admin?: boolean;
  customClaims?: Record<string, unknown>;
  [key: string]: unknown;
}): Promise<Result<AppUser, DomainError>> {
  // Fetch user record from Auth repository
  const userRecord = await userAuthRepository.getById(firebaseUser.id);
  if (!userRecord) {
    return err({ type: 'NotFound', message: 'Firebase Auth user not found' });
  }

  // Fetch user document from repository
  let userData = await userRepository.getById(firebaseUser.id);
  if (!userData) {
    // Create user record in Firestore if missing
    userData = {
      id: firebaseUser.id,
      email: firebaseUser.email,
      name: firebaseUser.name,
      role: firebaseUser.role ?? 'user',
      admin: firebaseUser.admin ?? false,
      customClaims: firebaseUser.customClaims ?? {},
    };
    await userRepository.create(userData);
  }

  // Merge role/admin from Firestore and custom claims
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
    await userAuthRepository.setRoleAndAdmin(firebaseUser.id, role, admin);
  }

  return ok({
    id: firebaseUser.id,
    email: userRecord.email,
    name: userRecord.displayName,
    role,
    admin,
    customClaims: { ...customClaims, role, admin },
    ...userData,
  });
}

/**
 * Upserts additional data for a user in Firestore.
 * If the user does not exist, creates a new record with the provided data.
 * @param id User ID (Firebase UID)
 * @param additionalData Arbitrary additional fields to merge into the user record
 */
export async function updateUserWithAdditionalData(
  id: string,
  additionalData: Record<string, unknown>
): Promise<Result<AppUser, DomainError>> {
  let user = await userRepository.getById(id);
  if (user) {
    user = { ...user, ...additionalData };
    const updateResult = await userRepository.update(id, additionalData);
    if (!updateResult) {
      return err({ type: 'Unknown', message: 'Failed to update user' });
    }
    return ok({ ...user, id: user.id ?? id });
  } else {
    const newUser: AppUser = { id, ...additionalData };
    const createResult = await userRepository.create(newUser);
    if (!createResult) {
      return err({ type: 'Unknown', message: 'Failed to create user with additional data' });
    }
    return ok(newUser);
  }
}