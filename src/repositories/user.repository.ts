// src/repositories/user.repository.ts
import { User } from '@models/user.model';
import { FirestoreOrm } from '@infrastructure/firestore/firestoreOrm';

const orm = FirestoreOrm.fromModel(User);

export const userRepository = {
  async getById(uid: string): Promise<User | null> {
    return orm.getById(uid);
  },
  async create(data: Omit<User, 'id'>): Promise<User> {
    return orm.create(data);
  },
  async update(id: string, data: Partial<User>): Promise<User | null> {
    // Only include customClaims if it matches Firestore's expected type
    const { customClaims, ...rest } = data;
    const updateData: Partial<User> = { ...rest };
    if (
      customClaims !== undefined &&
      typeof customClaims === 'object' &&
      customClaims !== null
    ) {
      // Only assign if customClaims is a plain object
      updateData.customClaims = customClaims as Record<string, unknown>;
    }
    return orm.update(id, updateData as FirebaseFirestore.UpdateData<User>);
  },
  async delete(id: string): Promise<void> {
    return orm.delete(id);
  },
  async getAll(): Promise<User[]> {
    return orm.getAll();
  },
  async find(filter: Partial<User>): Promise<User[]> {
    return orm.find(filter);
  },
};
