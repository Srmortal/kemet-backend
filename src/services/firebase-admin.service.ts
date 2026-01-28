import { ok, err } from '../types/result.types';
import type { Result } from '../types/result.types';
import type { ActionCodeSettings } from 'firebase-admin/auth';
import { firebaseAdminRepository } from '../repositories/firebaseAdmin.repository';

/**
 * Firebase Admin Service
 * 
 * Server-side Firebase Admin SDK operations for user management, authentication,
 * and Firestore interactions. All methods return Result<T> for explicit error handling.
 * 
 * Usage:
 * ```typescript
 * const firebaseAdminService = new FirebaseAdminService();
 * const result = await firebaseAdminService.createUser({ email: 'user@example.com' });
 * if (result.ok) {
 *   console.log('User UID:', result.value.uid);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export class FirebaseAdminService {
  /**
   * Create a Firebase user with email and optional password.
   * 
   * @param params - User creation parameters
   * @param params.email - User email address (must be unique)
   * @param params.password - Optional plaintext password (auto-hashed by Firebase)
   * @param params.displayName - Optional user display name
   * @param params.emailVerified - Optional flag to mark email as verified (default: false)
   * 
   * @returns Result containing user UID and basic profile info, or error
   * 
   * @example
   * const result = await service.createUser({
   *   email: 'newuser@example.com',
   *   displayName: 'John Doe',
   *   password: 'securePassword123'
   * });
   * if (result.ok) console.log('UID:', result.value.uid);
   */
  async createUser(params: { email: string; password?: string; displayName?: string; emailVerified?: boolean }): Promise<Result<{ uid: string; email?: string; displayName?: string; emailVerified?: boolean }>> {
    try {
      const userRecord = await firebaseAdminRepository.createUser(params);
      return ok({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to create user: ${(error as Error).message}` });
    }
  }
  /**
   * Create a custom token for a user.
   * 
   * Useful for server-to-server authentication or custom authentication flows.
   * Token is valid for 1 hour.
   * 
   * @param uid - Firebase user UID
   * @param additionalClaims - Optional custom claims to embed in the token
   * 
   * @returns Result containing JWT token string, or error
   * 
   * @example
   * const result = await service.createCustomToken('user123', { role: 'admin' });
   * if (result.ok) {
   *   const token = result.value; // Use in client authentication
   * }
   */
  async createCustomToken(uid: string, additionalClaims?: Record<string, unknown>): Promise<Result<string>> {
    try {
      const customToken = await firebaseAdminRepository.createCustomToken(uid, additionalClaims);
      return ok(customToken);
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to create custom token: ${(error as Error).message}` });
    }
  }

  /**
   * Get a Firebase user by UID.
   * 
   * @param uid - Firebase user UID
   * @returns Result containing user profile info, or error (404 if not found)
   * 
   * @example
   * const result = await service.getUserByUid('user123');
   * if (result.ok) {
   *   console.log('Email:', result.value.email);
   * }
   */
  async getUserByUid(uid: string): Promise<Result<{ uid: string; email?: string; emailVerified?: boolean; displayName?: string; photoURL?: string; disabled?: boolean; metadata?: { creationTime?: string; lastSignInTime?: string } }>> {
    try {
      const userRecord = await firebaseAdminRepository.getUserByUid(uid);
      return ok({
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime ? String(userRecord.metadata.creationTime) : undefined,
          lastSignInTime: userRecord.metadata.lastSignInTime ? String(userRecord.metadata.lastSignInTime) : undefined,
        },
      });
    } catch (error) {
      return err({ type: 'NotFound', message: `User not found: ${(error as Error).message}` });
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Result<{ uid: string; email?: string; emailVerified?: boolean; displayName?: string; photoURL?: string; disabled?: boolean }>> {
    try {
      const userRecord = await firebaseAdminRepository.getUserByEmail(email);
      return ok({
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
      });
    } catch (error) {
      return err({ type: 'NotFound', message: `User not found: ${(error as Error).message}` });
    }
  }

  /**
   * List users (paginated)
   */
  async listUsers(maxResults = 100, pageToken?: string): Promise<Result<{ users: Array<{ uid: string; email?: string; displayName?: string; disabled?: boolean }>; pageToken?: string }>> {
    try {
      const listUsersResult = await firebaseAdminRepository.listUsers(maxResults, pageToken);
      return ok({
        users: listUsersResult.users.map(u => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          disabled: u.disabled,
        })),
        pageToken: listUsersResult.pageToken,
      });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to list users: ${(error as Error).message}` });
    }
  }

  /**
   * Update user
   */
  async updateUser(uid: string, properties: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled?: boolean;
    emailVerified?: boolean;
  }): Promise<Result<{ uid: string; email?: string; displayName?: string; photoURL?: string; disabled?: boolean }>> {
    try {
      const userRecord = await firebaseAdminRepository.updateUser(uid, properties);
      return ok({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
      });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to update user: ${(error as Error).message}` });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<Result<{ success: boolean; message: string }>> {
    try {
      await firebaseAdminRepository.deleteUser(uid);
      return ok({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to delete user: ${(error as Error).message}` });
    }
  }

  /**
   * Set custom user claims
   * Useful for role-based access control
   */
  async setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<Result<{ success: boolean; message: string }>> {
    try {
      await firebaseAdminRepository.setCustomClaims(uid, claims);
      return ok({ success: true, message: 'Custom claims set successfully' });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to set custom claims: ${(error as Error).message}` });
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * Useful for forced logout or security incidents
   */
  async revokeRefreshTokens(uid: string): Promise<Result<{ success: boolean; message: string }>> {
    try {
      await firebaseAdminRepository.revokeRefreshTokens(uid);
      return ok({ success: true, message: 'Refresh tokens revoked successfully' });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to revoke tokens: ${(error as Error).message}` });
    }
  }

  /**
   * Generate email verification link
   */
  async generateEmailVerificationLink(email: string, actionCodeSettings?: ActionCodeSettings): Promise<Result<{ link: string }>> {
    try {
      const link = await firebaseAdminRepository.generateEmailVerificationLink(email, actionCodeSettings);
      return ok({ link });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to generate verification link: ${(error as Error).message}` });
    }
  }

  /**
   * Generate password reset link
   */
  async generatePasswordResetLink(email: string, actionCodeSettings?: ActionCodeSettings): Promise<Result<{ link: string }>> {
    try {
      const link = await firebaseAdminRepository.generatePasswordResetLink(email, actionCodeSettings);
      return ok({ link });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to generate reset link: ${(error as Error).message}` });
    }
  }

  // Firestore examples (if using Firestore)
  /**
   * Get Firestore document
   */
  async getDocument(collection: string, docId: string): Promise<Result<{ id: string; data?: Record<string, unknown> }>> {
    try {
      const doc = await firebaseAdminRepository.getDocument(collection, docId);
      if (!doc.exists) {
        return err({ type: 'NotFound', message: 'Document not found' });
      }
      return ok({
        id: doc.id,
        data: doc.data(),
      });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to get document: ${(error as Error).message}` });
    }
  }

  /**
   * Create or update Firestore document
   */
  async setDocument(collection: string, docId: string, data: Record<string, unknown>): Promise<Result<{ success: boolean; id: string }>> {
    try {
      await firebaseAdminRepository.setDocument(collection, docId, data);
      return ok({ success: true, id: docId });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to set document: ${(error as Error).message}` });
    }
  }

  /**
   * Query Firestore collection
   */
  async queryCollection(collection: string, filters?: { field: string; operator: FirebaseFirestore.WhereFilterOp; value: unknown }[]): Promise<Result<Array<{ id: string; data?: Record<string, unknown> }>>> {
    try {
      const snapshot = await firebaseAdminRepository.queryCollection(collection, filters);
      const docs = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        data: doc.data(),
      }));
      return ok(docs);
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to query collection: ${(error as Error).message}` });
    }
  }

  /**
   * Delete Firestore document
   */
  async deleteDocument(collection: string, docId: string): Promise<Result<{ success: boolean; message: string }>> {
    try {
      await firebaseAdminRepository.deleteDocument(collection, docId);
      return ok({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to delete document: ${(error as Error).message}` });
    }
  }
}
