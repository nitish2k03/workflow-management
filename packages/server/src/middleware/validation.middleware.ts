import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/api-error";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const key = err.path.join(".");
          if (!details[key]) details[key] = [];
          details[key].push(err.message);
        });
        next(
          new ApiError("VALIDATION_ERROR", "Validation failed", 400, details)
        );
      } else {
        next(error);
      }
    }
  };
};
