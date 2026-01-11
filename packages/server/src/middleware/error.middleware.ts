import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  // Custom API errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
  }

  // JWT errors
  if (error instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Access token has expired" },
    });
  }

  if (error instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid access token" },
    });
  }

  // MongoDB duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: { code: "DUPLICATE_ENTRY", message: `${field} already exists` },
    });
  }

  // MongoDB CastError (invalid ObjectId)
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid resource ID format" },
    });
  }

  // Default 500 error
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message,
    },
  });
};
