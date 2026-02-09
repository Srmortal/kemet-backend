import { UserRecord } from 'firebase-admin/lib/auth/user-record';

export interface UserAuthRepository {
  getById(uid: string): Promise<UserRecord | null>;
  setRoleAndAdmin(uid: string, role: string, admin?: boolean): Promise<void>;
}