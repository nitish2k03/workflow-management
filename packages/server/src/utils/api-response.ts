import { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: PaginationMeta
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(pagination && { pagination }),
  });
};

export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: Record<string, string[]>
) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details && { details }) },
  });
};
