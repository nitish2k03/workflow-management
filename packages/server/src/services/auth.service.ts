import { User, UserRole } from "../models/user.model";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.utils";
import { ApiError } from "../utils/api-error";
import { RegisterInput, LoginInput } from "@workflow/shared";

export class AuthService {
  async register(data: RegisterInput) {
    // Check if user exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError("DUPLICATE_ENTRY", "Email already registered", 409);
    }

    // Create user
    const user = await User.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: (data.role as UserRole) || UserRole.MEMBER,
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(data: LoginInput) {
    // Find user with password
    const user = await User.findOne({ email: data.email }).select("+password");

    if (!user) {
      throw new ApiError(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
        401
      );
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new ApiError(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
        401
      );
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new ApiError("UNAUTHORIZED", "User not found", 401);
      }

      const tokens = generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch (error) {
      throw new ApiError("UNAUTHORIZED", "Invalid refresh token", 401);
    }
  }

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("NOT_FOUND", "User not found", 404);
    }
    return user;
  }
}

export const authService = new AuthService();
