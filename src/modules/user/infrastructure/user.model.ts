export class User {
  id?: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bookingsCount = 0;
  favouritesCount = 0;
  bio?: string;
  role?: "user" | "admin";
  admin?: boolean;
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: Date | string;
  gender?: "M" | "F";
  expiryDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
