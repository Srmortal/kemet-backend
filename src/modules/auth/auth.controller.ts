import type { Request, Response } from "express";
import type { DomainError } from "#app/shared/types/domain-error.type.js";
import { ApiError } from "#app/shared/utils/core/ApiError.js";
import { asyncHandler } from "#app/shared/utils/core/asyncHandler.js";
import type { AuthService } from "./auth.service.js";
import type { components } from "./dtos/generated.js";

// OpenAPI-generated types
type SignUpRequest = Request<
  unknown,
  unknown,
  components["schemas"]["SignUpRequest"]
>;
type SignUpResponse = Response<components["schemas"]["SignUpResponse"]>;

type SignInRequest = Request<
  unknown,
  unknown,
  components["schemas"]["SignInRequest"]
>;
type SignInResponse = Response<components["schemas"]["SignInResponse"]>;

type VerifyRequest = Request<
  unknown,
  unknown,
  components["schemas"]["VerifyOtpRequest"]
>;
type VerifyResponse = Response<components["schemas"]["VerifyOtpResponse"]>;

type LogoutRequest = Request;
type LogoutResponse = Response<components["schemas"]["LogoutResponse"]>;

const BEARER_PREFIX = "Bearer ";

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  signUpUser = asyncHandler(
    async (
      req: SignUpRequest,
      res: SignUpResponse,
      next: (arg0: ApiError) => void
    ) => {
      const name =
        req.body.fullName?.trim() ||
        `${req.body.firstName} ${req.body.lastName}`.trim();

      const registerResult = await this.authService.register({
        email: req.body.email,
        name,
        password: req.body.password,
      });

      if (!registerResult.ok) {
        next(this.toApiError(registerResult.error));
        return;
      }

      const payload: components["schemas"]["SignUpResponse"] = {
        userId: registerResult.value.id,
        email: registerResult.value.email,
        ...(req.body.firstName ? { firstName: req.body.firstName } : {}),
        ...(req.body.lastName ? { lastName: req.body.lastName } : {}),
        requiresOtpVerification: false,
      };

      res.status(201).json(payload);
    }
  );

  signInUser = asyncHandler(
    async (
      req: SignInRequest,
      res: SignInResponse,
      next: (arg0: ApiError) => void
    ) => {
      const loginResult = await this.authService.login({
        email: req.body.email,
        password: req.body.password,
      });

      if (!loginResult.ok) {
        next(this.toApiError(loginResult.error));
        return;
      }

      const nameParts = loginResult.value.user.name?.trim().split(" ") ?? [];
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      const payload: components["schemas"]["SignInResponse"] = {
        accessToken: loginResult.value.token,
        user: {
          userId: loginResult.value.user.id,
          email: loginResult.value.user.email,
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
          role: loginResult.value.user.role,
        },
      };

      res.status(200).json(payload);
    }
  );

  verifyOtp = asyncHandler(
    async (
      req: VerifyRequest,
      res: VerifyResponse,
      next: (arg0: ApiError) => void
    ) => {
      const body = req.body as Record<string, unknown> | undefined;
      const tokenFromBody =
        typeof body?.idToken === "string" ? body.idToken : undefined;
      const token: string | undefined =
        tokenFromBody ?? this.extractBearerToken(req);

      if (!token) {
        next(new ApiError(400, "Missing session token"));
        return;
      }

      const sessionResult = await this.authService.validateSession(token);
      if (!sessionResult.ok) {
        next(this.toApiError(sessionResult.error));
        return;
      }

      const payload: components["schemas"]["VerifyOtpResponse"] = {
        success: true,
        message: "Session validated",
        user: {
          email: sessionResult.value.user.email,
          userId: sessionResult.value.user.id,
        },
      };

      res.status(200).json(payload);
    }
  );

  logoutUser = asyncHandler(
    async (
      req: LogoutRequest,
      res: LogoutResponse,
      next: (arg0: ApiError) => void
    ) => {
      const token = this.extractBearerToken(req);

      if (!token) {
        next(new ApiError(400, "Missing session token"));
        return;
      }

      const logoutResult = await this.authService.logout(token);
      if (!logoutResult.ok) {
        next(this.toApiError(logoutResult.error));
        return;
      }

      res.status(200).json({ status: "success" });
    }
  );

  private toApiError(domainError: DomainError): ApiError {
    switch (domainError.type) {
      case "NotFound":
        return new ApiError(404, domainError.message);
      case "Conflict":
        return new ApiError(409, domainError.message);
      default:
        return new ApiError(
          500,
          domainError.message || "Internal Server Error"
        );
    }
  }

  private extractBearerToken(req: Request<unknown>): string | undefined {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
      return undefined;
    }

    const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
    return token.length > 0 ? token : undefined;
  }
}
