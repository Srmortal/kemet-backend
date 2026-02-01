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
    return orm.update(id, data);
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
