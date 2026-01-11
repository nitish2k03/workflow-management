import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils";
import { User } from "../models/user.model";
import { ApiError } from "../utils/api-error";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new ApiError("UNAUTHORIZED", "Authentication token missing", 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw new ApiError("UNAUTHORIZED", "Invalid token: User not found", 401);
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};
