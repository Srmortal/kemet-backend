import { firebaseAdmin } from '../config/firebase';
import { ApiError } from '../utils/ApiError';
import type { ActionCodeSettings } from 'firebase-admin/auth';

/**
 * Firebase Admin Service
 * Provides server-side Firebase operations using Admin SDK
 */
export class FirebaseAdminService {
  /**
   * Create a Firebase user
   */
  async createUser(params: { email: string; password?: string; displayName?: string; emailVerified?: boolean }) {
    try {
      const userRecord = await firebaseAdmin.auth().createUser({
        email: params.email,
        password: params.password,
        displayName: params.displayName,
        emailVerified: params.emailVerified ?? false,
      });
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      };
    } catch (error) {
      throw new ApiError(500, `Failed to create user: ${(error as Error).message}`);
    }
  }
  /**
   * Create a custom token for a user
   * Useful for server-side authentication scenarios
   */
  async createCustomToken(uid: string, additionalClaims?: Record<string, unknown>): Promise<string> {
    try {
      const customToken = await firebaseAdmin.auth().createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      throw new ApiError(500, `Failed to create custom token: ${(error as Error).message}`);
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string) {
    try {
      const userRecord = await firebaseAdmin.auth().getUser(uid);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
        },
      };
    } catch (error) {
      throw new ApiError(404, `User not found: ${(error as Error).message}`);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    try {
      const userRecord = await firebaseAdmin.auth().getUserByEmail(email);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
      };
    } catch (error) {
      throw new ApiError(404, `User not found: ${(error as Error).message}`);
    }
  }

  /**
   * List users (paginated)
   */
  async listUsers(maxResults = 100, pageToken?: string) {
    try {
      const listUsersResult = await firebaseAdmin.auth().listUsers(maxResults, pageToken);
      return {
        users: listUsersResult.users.map(u => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          disabled: u.disabled,
        })),
        pageToken: listUsersResult.pageToken,
      };
    } catch (error) {
      throw new ApiError(500, `Failed to list users: ${(error as Error).message}`);
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
  }) {
    try {
      const userRecord = await firebaseAdmin.auth().updateUser(uid, properties);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
      };
    } catch (error) {
      throw new ApiError(500, `Failed to update user: ${(error as Error).message}`);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string) {
    try {
      await firebaseAdmin.auth().deleteUser(uid);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      throw new ApiError(500, `Failed to delete user: ${(error as Error).message}`);
    }
  }

  /**
   * Set custom user claims
   * Useful for role-based access control
   */
  async setCustomClaims(uid: string, claims: Record<string, unknown>) {
    try {
      await firebaseAdmin.auth().setCustomUserClaims(uid, claims);
      return { success: true, message: 'Custom claims set successfully' };
    } catch (error) {
      throw new ApiError(500, `Failed to set custom claims: ${(error as Error).message}`);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * Useful for forced logout or security incidents
   */
  async revokeRefreshTokens(uid: string) {
    try {
      await firebaseAdmin.auth().revokeRefreshTokens(uid);
      return { success: true, message: 'Refresh tokens revoked successfully' };
    } catch (error) {
      throw new ApiError(500, `Failed to revoke tokens: ${(error as Error).message}`);
    }
  }

  /**
   * Generate email verification link
   */
  async generateEmailVerificationLink(email: string, actionCodeSettings?: ActionCodeSettings) {
    try {
      const link = await firebaseAdmin.auth().generateEmailVerificationLink(email, actionCodeSettings);
      return { link };
    } catch (error) {
      throw new ApiError(500, `Failed to generate verification link: ${(error as Error).message}`);
    }
  }

  /**
   * Generate password reset link
   */
  async generatePasswordResetLink(email: string, actionCodeSettings?: ActionCodeSettings) {
    try {
      const link = await firebaseAdmin.auth().generatePasswordResetLink(email, actionCodeSettings);
      return { link };
    } catch (error) {
      throw new ApiError(500, `Failed to generate reset link: ${(error as Error).message}`);
    }
  }

  // Firestore examples (if using Firestore)
  /**
   * Get Firestore document
   */
  async getDocument(collection: string, docId: string) {
    try {
      const docRef = firebaseAdmin.firestore().collection(collection).doc(docId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new ApiError(404, 'Document not found');
      }
      
      return {
        id: doc.id,
        data: doc.data(),
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to get document: ${(error as Error).message}`);
    }
  }

  /**
   * Create or update Firestore document
   */
  async setDocument(collection: string, docId: string, data: Record<string, unknown>) {
    try {
      const docRef = firebaseAdmin.firestore().collection(collection).doc(docId);
      await docRef.set(data, { merge: true });
      return { success: true, id: docId };
    } catch (error) {
      throw new ApiError(500, `Failed to set document: ${(error as Error).message}`);
    }
  }

  /**
   * Query Firestore collection
   */
  async queryCollection(collection: string, filters?: { field: string; operator: FirebaseFirestore.WhereFilterOp; value: unknown }[]) {
    try {
      let query: FirebaseFirestore.Query = firebaseAdmin.firestore().collection(collection);
      
      if (filters) {
        filters.forEach(filter => {
          query = query.where(filter.field, filter.operator, filter.value);
        });
      }
      
      const snapshot = await query.get();
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));
      
      return docs;
    } catch (error) {
      throw new ApiError(500, `Failed to query collection: ${(error as Error).message}`);
    }
  }

  /**
   * Delete Firestore document
   */
  async deleteDocument(collection: string, docId: string) {
    try {
      await firebaseAdmin.firestore().collection(collection).doc(docId).delete();
      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      throw new ApiError(500, `Failed to delete document: ${(error as Error).message}`);
    }
  }
}
