import { Collection } from "@infrastructure/firestore/collection.decorator";

@Collection('users')
export class User {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  admin?: boolean;
  customClaims?: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
