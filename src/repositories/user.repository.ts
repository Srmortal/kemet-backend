// src/repositories/user.repository.ts
import { User } from '@models/user.model';
import { FirestoreOrm } from '@infrastructure/firestore/firestoreOrm';
import type { UserRepository as UserRepositoryPort } from '../ports/user-repository';

const orm = FirestoreOrm.fromModel(User);

export const userRepository: UserRepositoryPort = {
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
