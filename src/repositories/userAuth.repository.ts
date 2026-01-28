// src/repositories/userAuth.repository.ts
import { firebaseAdmin } from '@config/firebase';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

export const userAuthRepository = {
  async getById(uid: string): Promise<UserRecord | null> {
    try {
      return await firebaseAdmin.auth().getUser(uid);
    } catch (err) {
      return null;
    }
  },
  async setRoleAndAdmin(uid: string, role: string, admin: boolean = false): Promise<void> {
    // Only set from server side for security
    await firebaseAdmin.auth().setCustomUserClaims(uid, { role, admin });
  },
  // Add more auth-related methods as needed
};
