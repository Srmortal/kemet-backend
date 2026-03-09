import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { DomainError } from "../../shared/types/domain-error.type.js";
import { err, ok, type Result } from "../../shared/types/result.types.js";

type UserRole = "user" | "admin";

const MIN_PASSWORD_LENGTH = 8;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export interface RegisterInput {
  email: string;
  name?: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  createdAt: string;
  email: string;
  id: string;
  name?: string;
  role: UserRole;
}

export interface AuthSession {
  expiresAt: string;
  token: string;
  user: AuthUser;
}

interface StoredUser extends AuthUser {
  isActive: boolean;
  passwordHash: string;
  passwordSalt: string;
}

interface StoredSession {
  expiresAtMs: number;
  userId: string;
}

export class AuthService {
  private readonly usersByEmail = new Map<string, StoredUser>();
  private readonly usersById = new Map<string, StoredUser>();
  private readonly sessionsByToken = new Map<string, StoredSession>();

  async register(input: RegisterInput): Promise<Result<AuthUser, DomainError>> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const email = this.normalizeEmail(input.email);
    const name = input.name?.trim();

    if (!this.isValidEmail(email)) {
      return err({ message: "Invalid email format", type: "Unknown" });
    }

    if (input.password.length < MIN_PASSWORD_LENGTH) {
      return err({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        type: "Unknown",
      });
    }

    if (this.usersByEmail.has(email)) {
      return err({ message: "Email already registered", type: "Unknown" });
    }

    const passwordSalt = this.generateSalt();
    const passwordHash = this.hashPassword(input.password, passwordSalt);

    const user: StoredUser = {
      createdAt: new Date().toISOString(),
      email,
      id: randomUUID(),
      isActive: true,
      ...(name && name.length > 0 ? { name } : {}),
      passwordHash,
      passwordSalt,
      role: input.role ?? "user",
    };

    this.usersByEmail.set(email, user);
    this.usersById.set(user.id, user);

    return ok(this.toAuthUser(user));
  }

  async login(input: LoginInput): Promise<Result<AuthSession, DomainError>> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const email = this.normalizeEmail(input.email);
    const user = this.usersByEmail.get(email);

    if (!user?.isActive) {
      return err({ message: "Invalid credentials", type: "Unknown" });
    }

    const attemptedHash = this.hashPassword(input.password, user.passwordSalt);
    if (attemptedHash !== user.passwordHash) {
      return err({ message: "Invalid credentials", type: "Unknown" });
    }

    const token = this.generateToken();
    const expiresAtMs = Date.now() + SESSION_TTL_MS;

    this.sessionsByToken.set(token, {
      expiresAtMs,
      userId: user.id,
    });

    return ok({
      expiresAt: new Date(expiresAtMs).toISOString(),
      token,
      user: this.toAuthUser(user),
    });
  }

  async validateSession(
    token: string
  ): Promise<Result<AuthSession, DomainError>> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const session = this.sessionsByToken.get(token);

    if (!session) {
      return err({ message: "Session not found", type: "NotFound" });
    }

    const isExpired = session.expiresAtMs <= Date.now();
    if (isExpired) {
      this.sessionsByToken.delete(token);
      return err({ message: "Session expired", type: "Unknown" });
    }

    const user = this.usersById.get(session.userId);
    if (!user?.isActive) {
      this.sessionsByToken.delete(token);
      return err({ message: "Invalid session user", type: "Unknown" });
    }

    return ok({
      expiresAt: new Date(session.expiresAtMs).toISOString(),
      token,
      user: this.toAuthUser(user),
    });
  }

  async logout(token: string): Promise<Result<{ success: true }, DomainError>> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    this.sessionsByToken.delete(token);
    return ok({ success: true });
  }

  async deactivateUser(userId: string): Promise<Result<AuthUser, DomainError>> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async delay
    const user = this.usersById.get(userId);

    if (!user) {
      return err({ message: "User not found", type: "NotFound" });
    }

    user.isActive = false;

    for (const [token, session] of this.sessionsByToken) {
      if (session.userId === userId) {
        this.sessionsByToken.delete(token);
      }
    }

    return ok(this.toAuthUser(user));
  }

  // Useful in tests/dev simulation
  resetSimulationState(): void {
    this.usersByEmail.clear();
    this.usersById.clear();
    this.sessionsByToken.clear();
  }

  private toAuthUser(user: StoredUser): AuthUser {
    const authUser: AuthUser = {
      createdAt: user.createdAt,
      email: user.email,
      id: user.id,
      role: user.role,
    };

    if (user.name !== undefined) {
      authUser.name = user.name;
    }

    return authUser;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }

  private generateSalt(): string {
    return randomBytes(16).toString("hex");
  }

  private generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  private hashPassword(password: string, salt: string): string {
    return createHash("sha256").update(`${salt}:${password}`).digest("hex");
  }
}
