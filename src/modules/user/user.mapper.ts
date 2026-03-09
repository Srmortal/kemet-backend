import type { components } from "./dtos/generated.js";

// Domain to API ProfileDetails
export function toProfileDetailsDto(profile: {
  firstName: string;
  lastName: string;
  bio?: string;
  phoneNumber?: string;
  countryName?: string;
  email: string;
  dob?: string;
  bookingsCount: number;
  favouritesCount: number;
}): components["schemas"]["ProfileDetails"] {
  const result: components["schemas"]["ProfileDetails"] = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    bookingsCount: profile.bookingsCount,
    favouritesCount: profile.favouritesCount,
  };
  if (profile.bio !== undefined) {
    result.bio = profile.bio;
  }
  if (profile.phoneNumber !== undefined) {
    result.phoneNumber = profile.phoneNumber;
  }
  if (profile.countryName !== undefined) {
    result.countryName = profile.countryName;
  }
  if (profile.dob !== undefined) {
    result.dob = profile.dob;
  }
  return result;
}
