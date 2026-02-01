import { Collection } from "@infrastructure/firestore/collection.decorator";

@Collection('users')
export class User {
  id?: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bookingsCount: number = 0;
  favouritesCount: number = 0;
  bio?: string;
  role?: 'user' | 'admin';
  admin?: boolean;
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: Date | string;
  gender?: 'M' | 'F';
  expiryDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
