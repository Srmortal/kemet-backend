// src/repositories/firebaseAdmin.repository.ts
import { firebaseAdmin } from '@config/firebase';
import type { ActionCodeSettings } from 'firebase-admin/auth';

export class FirebaseAdminRepository {
  // Auth operations
  async createUser(params: { email: string; password?: string; displayName?: string; emailVerified?: boolean }) {
    return firebaseAdmin.auth().createUser({
      email: params.email,
      password: params.password,
      displayName: params.displayName,
      emailVerified: params.emailVerified ?? false,
    });
  }

  async createCustomToken(uid: string, additionalClaims?: Record<string, unknown>) {
    return firebaseAdmin.auth().createCustomToken(uid, additionalClaims);
  }

  async getUserByUid(uid: string) {
    return firebaseAdmin.auth().getUser(uid);
  }

  async getUserByEmail(email: string) {
    return firebaseAdmin.auth().getUserByEmail(email);
  }

  async listUsers(maxResults = 100, pageToken?: string) {
    return firebaseAdmin.auth().listUsers(maxResults, pageToken);
  }

  async updateUser(uid: string, properties: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled?: boolean;
    emailVerified?: boolean;
  }) {
    return firebaseAdmin.auth().updateUser(uid, properties);
  }

  async deleteUser(uid: string) {
    return firebaseAdmin.auth().deleteUser(uid);
  }

  async setCustomClaims(uid: string, claims: Record<string, unknown>) {
    return firebaseAdmin.auth().setCustomUserClaims(uid, claims);
  }

  async revokeRefreshTokens(uid: string) {
    return firebaseAdmin.auth().revokeRefreshTokens(uid);
  }

  async generateEmailVerificationLink(email: string, actionCodeSettings?: ActionCodeSettings) {
    return firebaseAdmin.auth().generateEmailVerificationLink(email, actionCodeSettings);
  }

  async generatePasswordResetLink(email: string, actionCodeSettings?: ActionCodeSettings) {
    return firebaseAdmin.auth().generatePasswordResetLink(email, actionCodeSettings);
  }

  // Firestore operations (using firebaseAdmin directly for admin functionality)
  async getDocument(collection: string, docId: string) {
    const docRef = firebaseAdmin.firestore().collection(collection).doc(docId);
    const doc = await docRef.get();
    return doc;
  }

  async setDocument(collection: string, docId: string, data: Record<string, unknown>) {
    const docRef = firebaseAdmin.firestore().collection(collection).doc(docId);
    await docRef.set(data, { merge: true });
    return docRef;
  }

  async queryCollection(collection: string, filters?: { field: string; operator: FirebaseFirestore.WhereFilterOp; value: unknown }[]) {
    let query: FirebaseFirestore.Query = firebaseAdmin.firestore().collection(collection);
    if (filters) {
      filters.forEach(filter => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }
    const snapshot = await query.get();
    return snapshot;
  }

  async deleteDocument(collection: string, docId: string) {
    const docRef = firebaseAdmin.firestore().collection(collection).doc(docId);
    await docRef.delete();
    return docRef;
  }
}

export const firebaseAdminRepository = new FirebaseAdminRepository();