import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { ActionCodeSettings } from 'firebase-admin/auth';

export interface FirebaseAdminRepository {
  createUser(params: { email: string; password?: string; displayName?: string; emailVerified?: boolean }): Promise<UserRecord>;
  createCustomToken(uid: string, additionalClaims?: Record<string, unknown>): Promise<string>;
  getUserByUid(uid: string): Promise<UserRecord>;
  getUserByEmail(email: string): Promise<UserRecord>;
  listUsers(maxResults?: number, pageToken?: string): Promise<any>;
  updateUser(uid: string, properties: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled?: boolean;
    emailVerified?: boolean;
  }): Promise<UserRecord>;
  deleteUser(uid: string): Promise<void>;
  setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<void>;
  revokeRefreshTokens(uid: string): Promise<void>;
  generateEmailVerificationLink(email: string, actionCodeSettings?: ActionCodeSettings): Promise<string>;
  generatePasswordResetLink(email: string, actionCodeSettings?: ActionCodeSettings): Promise<string>;
  getDocument(collection: string, docId: string): Promise<any>;
  setDocument(collection: string, docId: string, data: Record<string, unknown>): Promise<any>;
  queryCollection(collection: string, filters?: { field: string; operator: any; value: unknown }[]): Promise<any>;
  deleteDocument(collection: string, docId: string): Promise<any>;
}