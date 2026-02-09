import { User } from '../models/user.model';

export interface UserRepository {
  getById(uid: string): Promise<User | null>;
  create(data: Omit<User, 'id'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<void>;
  getAll(): Promise<User[]>;
  find(filter: Partial<User>): Promise<User[]>;
}