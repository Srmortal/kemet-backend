// User domain model for the user feature
export interface User {
  avatar: string;
  createdAt: string;
  displayName: string;
  email: string;
  id: string;
  isActive: boolean;
  roles: string[];
  username: string;
}

// Domain model for VerifyUserIdTokenRequest
export interface VerifyUserIdTokenRequest {
  dateOfBirth: string;
  expiryDate: string;
  fullName: string;
  gender: string;
  nationality: string;
  passportNumber: string;
}

// Domain model for VerifyUserIdTokenResponse
export interface VerifyUserIdTokenResponse {
  email: string;
  userId: string;
}

// Domain model for LogoutUserResponse
export interface LogoutUserResponse {
  status: string;
}

// Domain model for CreateUserRequest
export interface CreateUserRequest {
  displayName: string;
  email: string;
  emailVerified: boolean;
  password: string;
}

// Domain model for CreateUserResponse
export interface CreateUserResponse {
  displayName: string;
  email: string;
  emailVerified: boolean;
  uid: string;
}

// Domain model for User (API shape)
export interface UserApi {
  disabled?: boolean;
  displayName: string;
  email: string;
  emailVerified: boolean;
  metadata?: { creationTime?: string; lastSignInTime?: string };
  photoURL?: string;
  uid: string;
}

// Domain model for ProfileDetailsDto
export interface ProfileDetailsDto {
  bio?: string;
  bookingsCount: number;
  countryName?: string;
  dob?: string;
  email: string;
  favouritesCount: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}
