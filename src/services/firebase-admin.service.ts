import { ok, err } from '../types/result.types';
import type { Result } from '../types/result.types';
import type { ActionCodeSettings } from 'firebase-admin/auth';
import type { FirebaseAdminRepository } from '../ports/firebase-admin-repository';

export class FirebaseAdminService {
  constructor(private repo: FirebaseAdminRepository) {}

  async createUser(params: { email: string; password?: string; displayName?: string; emailVerified?: boolean }): Promise<Result<{ uid: string; email?: string; displayName?: string; emailVerified?: boolean }>> {
    try {
      const userRecord = await this.repo.createUser(params);
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

  async createCustomToken(uid: string, additionalClaims?: Record<string, unknown>): Promise<Result<string>> {
    try {
      const customToken = await this.repo.createCustomToken(uid, additionalClaims);
      return ok(customToken);
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to create custom token: ${(error as Error).message}` });
    }
  }

  async getUserByUid(uid: string): Promise<Result<{ uid: string; email?: string; emailVerified?: boolean; displayName?: string; photoURL?: string; disabled?: boolean; metadata?: { creationTime?: string; lastSignInTime?: string } }>> {
    try {
      const userRecord = await this.repo.getUserByUid(uid);
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

  async getUserByEmail(email: string): Promise<Result<{ uid: string; email?: string; emailVerified?: boolean; displayName?: string; photoURL?: string; disabled?: boolean }>> {
    try {
      const userRecord = await this.repo.getUserByEmail(email);
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

  async listUsers(maxResults = 100, pageToken?: string): Promise<Result<{ users: Array<{ uid: string; email?: string; displayName?: string; disabled?: boolean }>; pageToken?: string }>> {
    try {
      const listUsersResult = await this.repo.listUsers(maxResults, pageToken);
      return ok({
        users: listUsersResult.users.map((u: any) => ({
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

  async updateUser(uid: string, properties: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled?: boolean;
    emailVerified?: boolean;
  }): Promise<Result<{ uid: string; email?: string; displayName?: string; photoURL?: string; disabled?: boolean }>> {
    try {
      const userRecord = await this.repo.updateUser(uid, properties);
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

  async deleteUser(uid: string): Promise<Result<{ success: boolean; message: string }>> {
    try {
      await this.repo.deleteUser(uid);
      return ok({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to delete user: ${(error as Error).message}` });
    }
  }

  async setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<Result<{ success: boolean; message: string }>> {
    try {
      await this.repo.setCustomClaims(uid, claims);
      return ok({ success: true, message: 'Custom claims set successfully' });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to set custom claims: ${(error as Error).message}` });
    }
  }

  async revokeRefreshTokens(uid: string): Promise<Result<{ success: boolean; message: string }>> {
    try {
      await this.repo.revokeRefreshTokens(uid);
      return ok({ success: true, message: 'Refresh tokens revoked successfully' });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to revoke tokens: ${(error as Error).message}` });
    }
  }

  async generateEmailVerificationLink(email: string, actionCodeSettings?: ActionCodeSettings): Promise<Result<{ link: string }>> {
    try {
      const link = await this.repo.generateEmailVerificationLink(email, actionCodeSettings);
      return ok({ link });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to generate verification link: ${(error as Error).message}` });
    }
  }

  async generatePasswordResetLink(email: string, actionCodeSettings?: ActionCodeSettings): Promise<Result<{ link: string }>> {
    try {
      const link = await this.repo.generatePasswordResetLink(email, actionCodeSettings);
      return ok({ link });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to generate reset link: ${(error as Error).message}` });
    }
  }

  async getDocument(collection: string, docId: string): Promise<Result<{ id: string; data?: Record<string, unknown> }>> {
    try {
      const doc = await this.repo.getDocument(collection, docId);
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

  async setDocument(collection: string, docId: string, data: Record<string, unknown>): Promise<Result<{ success: boolean; id: string }>> {
    try {
      await this.repo.setDocument(collection, docId, data);
      return ok({ success: true, id: docId });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to set document: ${(error as Error).message}` });
    }
  }

  async queryCollection(collection: string, filters?: { field: string; operator: any; value: unknown }[]): Promise<Result<Array<{ id: string; data?: Record<string, unknown> }>>> {
    try {
      const snapshot = await this.repo.queryCollection(collection, filters);
      const docs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        data: doc.data(),
      }));
      return ok(docs);
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to query collection: ${(error as Error).message}` });
    }
  }

  async deleteDocument(collection: string, docId: string): Promise<Result<{ success: boolean; message: string }>> {
    try {
      await this.repo.deleteDocument(collection, docId);
      return ok({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to delete document: ${(error as Error).message}` });
    }
  }
}
