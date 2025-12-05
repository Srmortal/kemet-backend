import bcrypt from 'bcryptjs';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import config from '../config';
import { ApiError } from '../utils/ApiError';
import { UserService } from './user.service';

const userService = new UserService();

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (you would save to database here)
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      password: hashedPassword,
      createdAt: new Date(),
    };

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    // Get user from database
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email!);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret as Secret) as { id: string };

      const user = await userService.getUserById(decoded.id);
      if (!user) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      const accessToken = this.generateAccessToken(user.id, user.email!);

      return { accessToken };
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async loginWithFirebase(firebaseUid: string, email?: string, name?: string) {
    // Get or create an application user mapped to Firebase UID
    const appUser = await userService.getOrCreateFromFirebase(firebaseUid, { email, name });

    // Rely on Firebase ID tokens only; do not issue local JWTs
    return { user: appUser };
  }

  private generateAccessToken(id: string, email: string): string {
    return jwt.sign({ id, email }, config.jwt.secret as Secret, {
      expiresIn: config.jwt.expiresIn,
    } as SignOptions);
  }

  private generateRefreshToken(id: string): string {
    return jwt.sign({ id }, config.jwt.secret as Secret, {
      expiresIn: '30d',
    } as SignOptions);
  }
}
