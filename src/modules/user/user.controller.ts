// src/controllers/user.controller.ts

import type { NextFunction, Request, Response } from "express";
import { ApiError } from "#app/shared/utils/core/ApiError.js";
import { asyncHandler } from "#app/shared/utils/core/asyncHandler.js";
import type { components } from "./dtos/generated.js";
import type { UserService } from "./user.service.js";

export class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  private getDateOfBirthString(dateOfBirth: unknown): string | null {
    if (dateOfBirth instanceof Date) {
      return dateOfBirth.toISOString();
    }
    if (typeof dateOfBirth === "string") {
      return dateOfBirth;
    }
    return null;
  }

  getUserProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;

      if (!userId) {
        next(new ApiError(401, "User not authenticated"));
        return;
      }

      const result = await this.userService.getUserProfileService(userId);
      if (result.ok) {
        const user = result.value;
        const dateOfBirthInput = this.getDateOfBirthString(user.dateOfBirth);
        const dobObject = dateOfBirthInput ? { dob: dateOfBirthInput } : {};

        const profile: components["schemas"]["ProfileDetails"] = {
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ")[1] || "",
          email: user.email || "",
          bookingsCount: user.bookingsCount,
          favouritesCount: user.favouritesCount,
          ...(user.bio !== undefined ? { bio: user.bio } : {}),
          ...(user.phoneNumber !== undefined
            ? { phoneNumber: user.phoneNumber }
            : {}),
          ...(user.nationality !== undefined
            ? { countryName: user.nationality }
            : {}),
          ...dobObject,
        };
        res.status(200).json(profile);
      } else {
        switch (result.error?.type) {
          case "NotFound":
            throw new ApiError(404, "User not found");
          case "ValidationError":
            throw new ApiError(401, "Validation error");
          case "Conflict":
            throw new ApiError(409, "Conflict error");
          default:
            throw new ApiError(500, "Server error");
        }
      }
    }
  );
}
