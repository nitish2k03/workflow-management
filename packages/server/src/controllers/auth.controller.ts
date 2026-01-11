import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { successResponse } from "../utils/api-response";
import { AuthRequest } from "../middleware/auth.middleware";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      successResponse(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      // 'Login successful' message is causing error because successResponse expects (res, data, status, pagination) not (res, data, message) unless we change utils.
      // Based on utils/api-response.ts: export const successResponse = <T>(res: Response, data: T, statusCode = 200, pagination?: PaginationMeta)
      // It does NOT accept a message string as the 3rd argument. 3rd arg is statusCode number.
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!._id);
      successResponse(res, { user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
